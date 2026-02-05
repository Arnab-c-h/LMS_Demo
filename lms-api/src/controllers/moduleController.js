const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

const checkCourseOwnership = async (courseId, userId, role) => {
	if (role === 'ADMIN') return true;

	const course = await prisma.course.findUnique({
		where: { id: courseId },
		select: { instructorId: true },
	});

	if (!course) return false;

	return course.instructorId === userId;
};

// --- CREATE MODULE ---
exports.createModule = catchAsync(async (req, res, next) => {
	// We expect courseId in the params (from nesting routes)
	const { courseId } = req.params;

	//SEC CHECK - DOES THE SAME GUY OWN THE COURSE
	const isOwner = await checkCourseOwnership(courseId, req.user.id, req.user.role);
	if (!isOwner) {
		return next(
			new AppError(
				'You do not have permission to add modules to this course.',
				403,
			),
		);
	}

	const course = await prisma.course.findUnique({ where: { id: courseId } });
	if (!course) return next(new AppError('No course found with this ID', 404));
	const { title, order } = req.body;

	const newModule = await prisma.module.create({
		data: {
			title,
			order,
			courseId,
		},
	});

	res.status(201).json({
		status: 'success',
		data: { module: newModule },
	});
});

//GET ALL MODULES OF A COURSE
exports.getAllModules = catchAsync(async (req, res, next) => {
	const modules = await prisma.module.findMany({
		where: {
			courseId: req.params.courseId,
		},
		orderBy: {
			order: 'asc',
		},
		include: { lessons: true },
	});

	res.status(200).json({
		status: 'success',
		results: modules.length,
		data: { modules },
	});
});

// --- UPDATE MODULE ---
exports.updateModule = catchAsync(async (req, res, next) => {
	const { courseId, id } = req.params;

	const isOwner = await checkCourseOwnership(
		courseId,
		req.user.id,
		req.user.role,
	);
	if (!isOwner) {
		return next(
			new AppError(
				'You do not have permission to edit this module.',
				403,
			),
		);
	}
	//find module ensuring it berlongfs to course
	const moduleToUpdate = await prisma.module.findFirst({
		where: {
			id,
			courseId,
		},
	});

	if (!moduleToUpdate) {
		return next(
			new AppError(
				`NO module of ${id} found in the course ${courseId}`,
				404,
			),
		);
	}

	const updatedModule = await prisma.module.update({
		where: { id },
		data: req.body,
	});

	res.status(200).json({
		status: 'success',
		data: { module: updatedModule },
	});
});

// --- DELETE MODULE ---
exports.deleteModule = catchAsync(async (req, res, next) => {
	const { courseId, id } = req.params;

	const isOwner = await checkCourseOwnership(
		courseId,
	
        req.user.id,
		req.user.role,
	);
	if (!isOwner) {
		return next(
			new AppError(
				'You do not have permission to edit this module.',
				403,
			),
		);
	}

	//find module ensuring it berlongfs to course
	const moduleToDelete = await prisma.module.findFirst({
		where: {
			id,
			courseId,
		},
	});

	if (!moduleToDelete) {
		return next(
			new AppError(
				`NO module of ${id} found in the course ${courseId}`,
				404,
			),
		);
	}

	await prisma.module.delete({
		where: { id },
	});

	res.status(200).json({
		status: 'success',
		data: null,
	});
});
