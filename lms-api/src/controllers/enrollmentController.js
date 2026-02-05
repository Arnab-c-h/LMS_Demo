const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

const prisma = new PrismaClient();

//For Students - they can enroll themselves
exports.selfEnroll = catchAsync(async (req, res, next) => {
	const { courseId } = req.params;
	const userId = req.user.id;

	const enrollemt = await prisma.enrollemt.create({
		data: { userId, courseId },
	});

	res.status(201).json({
		status: 'success',
		data: { enrollemt },
	});
});

//Managed Enrolled by ADMIN/INSTR

exports.enrollStud = catchAsync(async (req, res, next) => {
	const { courseId } = req.params;
	const { userId } = req.body;

	if (!userId) {
		return next(
			new AppError(`Please provide a valid ID of the student`, 400),
		);
	}

	const enrollemt = await prisma.enrollemt.create({
		data: { userId, courseId },
	});

	res.status(201).json({
		status: 'success',
		data: { enrollemt },
	});
});

//unenroll Students
exports.unenroll = catchAsync(async (req, res, next) => {
	const { courseId } = req.params;

	const userId = req.user.role === 'STUDENT' ? req.user.id : req.body.userId;

	await prisma.enrollment.delete({
		where: { userId_courseId: { userId, courseId } },
	});

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
