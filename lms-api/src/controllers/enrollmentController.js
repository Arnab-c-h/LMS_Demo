const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

const prisma = new PrismaClient();

// //For Students - they can enroll themselves
// exports.selfEnroll = catchAsync(async (req, res, next) => {
// 	const { courseId } = req.params;
// 	const targetUserId = req.targetUserId; //refer middlewa
// 	//1)Target user exists ?
// 	const userExists = await prisma.user.findUnique({
// 		where: { id: targetUserId },
// 	});
// 	if (!userExists) return next(new AppError(`User not found`, 404));
// 	//2) Check for duplicates
// 	const existing = await prisma.enrollment.findUnique({
// 		where: { userId_courseId: { userId: targetUserId, courseId } },
// 	});// 	if (existing) {
// 		return next(new AppError(`User is already enrolled`, 400));
// 	}
// 	//3) Create enrollment
// 	const enrollemt = await prisma.enrollment.create({
// 		data: {
// 			userId: targetUserId,
// 			courseId,
// 		},
// 	});
// });

//Managed Enrolled by ADMIN/INSTR

exports.enrollStud = catchAsync(async (req, res, next) => {
	const { courseId } = req.params;
	const { userId } = req.body;

	if (!userId) {
		return next(
			new AppError(`Please provide a valid ID of the student`, 400),
		);
	}

	const enrollment = await prisma.enrollment.create({
		data: { userId, courseId },
	});

	res.status(201).json({
		status: 'success',
		message: 'Enrollment successfull',
		data: { enrollment },
	});
});

//unenroll Students
exports.unenroll = catchAsync(async (req, res, next) => {
	const { courseId } = req.params;
	const targetUserId = req.targetUserId;

	//deleteMany.count returns 0 if no record found unlike delete(), so no try catch block
	const result = await prisma.enrollment.deleteMany({
		where: {
			userId: targetUserId,
			courseId,
		},
	});

	if (result.count === 0) {
		return next(
			new AppError(`Enrollment not found or already removed.`, 404),
		);
	}

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

//Get My Enrolled Courses
exports.getMyCourses = catchAsync(async (req, res, next) => {
	const enrollments = await prisma.enrollment.findMany({
		where: { userId: req.user.id },
		include: {
			course: {
				select: {
					id: true,
					title: true,
					thumbnail: true,
					description: true,
					instructor: { select: { name: true, photo: true } },
					_count: { select: { modules: true } },
				},
			},
		},
	});
	//map loops through every item in enrollments var(which has userId,courseId,courses) and just gives us the .course part
	const courses = enrollments.map((e) => e.course);

	res.status(200).json({
		status: 'success',
		results: courses.length,
		data: { courses },
	});
});

exports.getCourseStudents = catchAsync(async (req, res, next) => {
	if (!req.params.courseId) {
		return next(
			new AppError('This route must be accessed via course URL', 400),
		);
	}

	const enrollments = await prisma.enrollment.findMany({
		where: { courseId: req.params.courseId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					rollNumber: true,
					role: true,
					active: true,
					email: true,
				},
			},
		},
	});

	const students = enrollments.map((e) => {
		return e.user;
	});

	res.status(200).json({
		status: 'success',
		results: students.length,
		data: { students },
	});
});
