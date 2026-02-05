const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');

const prisma = new PrismaClient();

exports.checkEnrollmentPermisson = catchAsync(async (req, res, next) => {
	const { courseId } = req.params;
	const { studentId } = req.body;
	const currentUser = req.user;

	//1) Who is being enrolled
	//if studentId provided in body, INSTR/ADM enrolls him
	const targetUserId = studentId || currentUser.id;

	//2)attach target to req object so controller doesnt have to do it again
	req.targetUserId = targetUserId;

	//Case A - Self Enroll/Unenroll
	if (targetUserId === currentUser.id) {
		return next();
	}

	//Case B - Enroll/Unenroll someone else
	//a)CHeck role
	if (currentUser.role === 'STUDENT') {
		return next(
			new AppError(`Students cant manage other's enrollment`, 403),
		);
	}

	if (currentUser.role === 'ADMIN') {
		return next();
	}

	//b) Check INSTR ownership of course
	if (currentUser.role === 'INSTRUCTOR') {
		const course = await prisma.course.findUnique({
			where: { id: courseId },
			select: { instructorId: true },
		});

		if (!course) {
			return next(new AppError(`COurse not found`, 404));
		}

		if (course.instructorId !== currentUser.id) {
			return next(
				new AppError(`You do not own the course ${courseId}`, 403),
			);
		}

		return next();
	}

    //Fallback
    return next(new AppError(`Permisson Denied`,403))
});
