const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

const prisma = new PrismaClient();

//check ownership
const checkModuleOwnership = async (moduleId, userId, role) => {
	if (role === 'ADMIN') return true;

	const module = await prisma.module.findUnique({
		where: { id: moduleId },
		include: { course: { select: { instructorId: true } } },
	});

	if (!module) return false;

	return module.course.instructorId === moduleId;
};

//Create lessons
exports.createLesson = catchAsync(async (req, res, next) => {
	const { moduleId } = req.params;

	const isOwner = await checkModuleOwnership(
		courseId,
		req.user.id,
		req.user.role,
	);
	if (!isOwner) {
		return next(
			new AppError(
				'You do not have permission to add lessons to this course.',
				403,
			),
		);
	}

	const module = await prisma.module.findUnique({
		where: {
			id: moduleId,
		},
	});
	if (!module) {
		return next(new AppError(`No module found with that ID`, 404));
	}
	const { title, order, type, videoUrl, duration, textContent, fileUrl } =
		req.body;

	const newLesson = await prisma.lesson.create({
		data: {
			title,
			order,
			type,
			moduleId,
			videoUrl: type === 'VIDEO' ? videoUrl : null,
			duration: type === 'VIDEO' ? duration : null,
			textContent: type === 'TEXT' ? textContent : null,
			fileUrl: type === 'FILE' ? videoUrl : null,
		},
	});

	res.status(201).json({
		status: 'success',
		data: { lesson: newLesson },
	});
});

//Get all lessons
exports.getAllLessons = catchAsync(async (req, res, next) => {
	const { moduleId } = req.params;
	const userId = req.user.id;
	const role = req.user.role;

	const moduleData = await prisma.module.findUnique({
		where: { id: moduleId },
		include: { course: { select: { id: true, instructorId: true } } },
	});

	if (!moduleData) {
		return next(new AppError(`Module doesnt exist`, 404));
	}

	const courseId = moduleData.course.id;

	//if user has full access
	let hasfullAccess = false;

	if (role === 'ADMIN') return (hasfullAccess = true);
	else if (role === 'INSTRUCTOR') {
		if (moduleData.course.instructorId === userId) {
			hasfullAccess = true;
		}
	} else {
		const enrollment = await prisma.enrollment.findUnique({
			where: {
				userId_courseId: {
					userId,
					courseId,
				},
			},
		});

		//check if user is enrolled finally
		if (enrollment) return (hasfullAccess = true);
	}

	const selectFields = hasfullAccess
		? undefined
		: {
				id: true,
				title: true,
				type: true,
				duration: true,
				order: true,
				moduleId: true,
			};

	const lessons = await prisma.lesson.findMany({
		where: { moduleId },
		orderBy: { order: 'asc' },
		select: selectFields,
	});

	res.status(200).json({
		status: 'success',
		results: lessons.length,
		data: {
			accessLevel: hasfullAccess ? 'full' : 'restricted',
			lessons,
		},
	});
});

exports.getLesson = catchAsync(async (req, res, next) => {
	// LATER: We will add checkEnrollment() middleware before this to ensure student paid.

	const lesson = await prisma.lesson.findUnique({
		where: { id: req.params.id },
	});

	if (!lesson) {
		return next(new AppError('No lesson found with that ID', 404));
	}

	res.status(200).json({
		status: 'success',
		data: { lesson },
	});
});
//Update Lesson
exports.updateLesson = catchAsync(async (req, res, next) => {
	const { moduleId, id } = req.params;

	const isOwner = await checkModuleOwnership(
		moduleId,
		req.user.id,
		req.user.role,
	);

	if (!isOwner) {
		return next(new AppError(`You are not the owner of this Course`, 404));
	}

	//find lesson ensuring it belongs to module
	const lessonToUpdate = await prisma.lesson.findFirst({
		where: { id, moduleId },
	});

	if (!lessonToUpdate) {
		return next(new AppError(`The lesson ${id} does not exist `, 404));
	}

	const updatedLesson = await prisma.lesson.update({
		where: { id },
		data: req.body,
	});

	res.status(200).json({
		status: 'success',
		data: { updatedLesson },
	});
});

//Delete Lesson
exports.deleteModule = catchAsync(async (req, res, next) => {
	const { moduleId, id } = req.params;

	const isOwner = await checkModuleOwnership(
		moduleId,
		req.user.id,
		req.user.role,
	);

	if (!isOwner) {
		return next(new AppError(`You are not the owner of this Course`, 404));
	}

	//find lesson ensuring it belongs to module
	const lessonToUpdate = await prisma.lesson.findFirst({
		where: { id, moduleId },
	});

	if (!lessonToUpdate) {
		return next(new AppError(`The lesson ${id} does not exist `, 404));
	}

	await prisma.lesson.delete({
		where: { id },
	});

	res.status(200).json({
		status: 'success',
		data: null,
	});
});
