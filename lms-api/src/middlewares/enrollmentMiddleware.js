const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync.js');

const prisma = new PrismaClient();

const checkEnrollmentStatus = catchAsync(async (req, res, next) => {
	//ADMIN bypass
	if (req.user.role === 'ADMIN') {
		//we add isEnrolled property to req
		req.isEnrolled = true;
		return next();
	}

	//check enrollemnt OR instr status
	const [enrollment, course] = await Promise.all([
		prisma.enrollment.findUnique({
			where: {
				userId_courseId: { userId, courseId },
			},
		}),
		prisma.course.findUnique({
			where: { id: courseId },
			select: { instructorId: true },
		}),
	]);

	req.isEnrolled = !!enrollment || course?.instructorId === userId;
	next();
});
