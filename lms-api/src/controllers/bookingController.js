const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');

const prisma = new PrismaClient();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
	//1)Get currently booked course
	const course = await prisma.course.findUnique({
		where: { id: req.params.courseId },
	});
	if (!course) return next(new AppError(`NO course found with that id`, 404));

	//2) Create Checkout Session
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		//SUCCESS URL
		//Testing --> api respons
		success_url: `${req.protocol}://${req.get('host')}/api/v1/courses/${course.id}?alert=booking`,
		cancel_url: `${req.protocol}://${req.get('host')}/api/v1/courses/${course.id}`,
		customer_email: req.user.email,
		client_reference_id: req.params.courseId,

		//Metadata
		//allows us to pass data to webhook
		metadata: {
			userId: req.user.id,
			courseId: course.id,
		},
		line_items: [
			{
				price_data: {
					currency: 'usd',
					unit_amount: (course.price || 10) * 100, // Amount in Cents ($10.00)
					product_data: {
						name: `${course.title} Course`,
						description:
							course.description ||
							'Access to full course content',
						// images: [course.thumbnail],
					},
				},
				quantity: 1,
			},
		],
		mode: 'payment',
	});

	res.status(200).json({
		status: 'success',
		session,
	});
});

exports.webhookCheckout = catchAsync(async (req, res, next) => {
    console.log('--> Webhook HIT! Body type:', typeof req.body);
	console.log('--> Is Buffer?', Buffer.isBuffer(req.body));
	const signature = req.headers['stripe-signature'];
	let event;

	try {
		//verify signature using raw body
		//req.body is raw and not json
		event = stripe.webhooks.constructEvent(
			req.body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err) {
		return res.status(400).send(`Webhook Error : ${err.message}`);
	}
    console.log('EVENT TYPE RECEIVED:', event.type);
	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
        
        console.log('SESSION OBJECT:', JSON.stringify(session, null, 2));


		// Fulfill the purchase
		//better to use client_reference_id as it is a first class citizen in stripe's dash(ez access) adn directly links it to an unique courseId
		const courseId = session.client_reference_id;
		const userId = session.metadata.userId;

		try {
			await prisma.enrollment.create({
				data: {
					userId,
					courseId,
				},
			});
		} catch (err) {
			// If error is P2002 (Unique constraint), just ignore logic
			// User already enrolled
			console.log('User already enrolled via webhook:', err.message);
		}

	}
    res.status(200).json({ received: true });
});
