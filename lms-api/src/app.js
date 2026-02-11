const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const cors = require('cors');

//import routes
const userRouter = require('../src/routes/userRoutes.js');
const courseRouter = require('../src/routes/courseRoutes.js');
const enrollmentRouter = require('../src/routes/enrollmentRoutes.js');
const bookingRouter = require('../src/routes/bookingRoutes.js');

const bookingController = require('../src/controllers/bookingController.js');

//import uitl
const AppError = require('../src/utils/appError.js');
const globalErrorHandler = require('../src/controllers/errorController.js');

const app = express();

//1-GLOBAL MIDDLEWARES
//stripe webhook
app.post(
	'/webhook-checkout',
	express.raw({ type: '*/*' }),
	bookingController.webhookCheckout,
);

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try aghain in some time',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(hpp());
// app.use(xss());
app.use(cors());

//2-ROUTES
//
//
//
app.get('/', (req, res) => {
	res.send('API is running!');
});

//User Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/enrollments', enrollmentRouter);
app.use('/api/v1/bookings', bookingRouter);

//3-UNHANDLED ROUTE HANDLER
//if here, no routes match
app.all(/.*/, (req, res, next) => {
	next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});

//4-GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
