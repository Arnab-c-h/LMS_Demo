const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const strict = require('assert/strict');
const { stat } = require('fs');

const prisma = new PrismaClient();

//CREATE COURSE
exports.createCourse = catchAsync(async (req, res, next) => {
	//1)Generate slug
	const slug = slugify(req.body.title, { lower: true, strict: true });

	//2)Preaper Data ( Instr is current user)
	const courseData = {
		...req.body,
		slug,
		instructorId: req.user.id,
	};

	const newCourse = await prisma.course.create({ data: courseData });

	res.status(201).json({
		status: 'success',
		data: { course: courseData },
	});
});

//GET ALL COURSES
exports.getAllCourses = catchAsync(async (req, res, next) => {
	const courses = await prisma.course.findMany({
		where: { published: true },
		include: {
			instructor: { select: { name: true, email: true } },
			_count: {
				select: { modules: true, enrollments: true },
			},
		},
	});

	res.status(200).json({
		status: 'success',
		results: courses.length,
		data: { courses },
	});
});

//GET SINGLE COURSE
exports.getCourse = catchAsync(async (req, res, next) => {
	const course = await prisma.course.findUnique({
		where: { id: req.params.id },
		include: {
			modules: {
				orderBy: { order: 'asc' },
				include: {
					lessons: {
						orderBy: { order: 'asc' },
						select: {
							id: true,
							title: true,
							type: true,
							duration: true,
						},
					},
				},
			},
			instructor: {
				select: {
					name: true,
					photo: true,
				},
			},
		},
	});

	if (!course) {
		return next(
			new AppError(
				`There is no course with the id ${req.params.id}`,
				404,
			),
		);
	}

	res.status(200).json({
		status: 'success',
		data: { course },
	});
});

//UPDATE COURSE
exports.updateCourse = catchAsync(async (req, res, next) => {
	//1)Check if course exists
	const course = await prisma.course.findUnique({
		where: { id: req.params.id },
	});
	if (!course) {
		return next(
			new AppError(
				`There is no course with the id ${req.params.id}`,
				404,
			),
		);
	}

	//2)Ownership Check(If user is Instr)\
	if (req.user.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
		return next(
			new AppError(
				'You do not have permission to edit this course as you are not the owner',
				403,
			),
		);
	}

	//Update Slug if title changes
	if (req.body.title) {
		req.body.slug = slugify(req.body.title, { lower: true, strict: true });
	}

	const updatedCourse = await prisma.course.update({
		where: { id: req.params.id },
		data: req.body,
	});

	res.status(200).json({
		status: 'success',
		data: { course: updatedCourse },
	});
});

//DELETE COURSE
exports.deleteCourse = catchAsync(async (req, res, next) => {
	const course = await prisma.course.findUnique({
		where: { id: req.params.id },
	});
	if (!course) {
		return next(
			new AppError(
				`There is no course with the id ${req.params.id}`,
				404,
			),
		);
	}

	//2)Ownership Check(If user is Instr)\
	if (req.user.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
		return next(
			new AppError(
				'You do not have permission to edit this course as you are not the owner',
				403,
			),
		);
	}

	await prisma.course.delete({
		where: { id: req.params.id },
	});

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
