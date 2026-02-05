const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');


const prisma = new PrismaClient();

//Security - allows only certain fields(allowedFields) to be updated for a given user(obj)
const filterObj = (obj, ...allowedFields) => {
	const newObj = {};
	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el];
	});
	return newObj;
};

//Create USER [ADMIN,INSTR]

exports.createUser = catchAsync(async (req, res, next) => {
	const { name, email, password, rollNumber, role } = req.body;

	//INSTR can only create students
	if (req.user.role === 'INSTRUCTOR' && req.user.role !== 'STUDENT') {
		return next(new AppError('Instructors can only create students', 403));
	}

	//Hash passwords
	const hashedPwd = await bcrypt.hash(password, 12);

	const newUser = await prisma.user.create({
		data: {
			name,
			email,
			password: hashedPwd,
			rollNumber: role === 'STUDENT' ? rollNumber : null,
			role: role || 'STUDENT',
			createdById: req.user.id,
		},
	});

	//remove password from response
	newUser.password = undefined;

	res.status(200).json({
		status: 'success',
		data: {
			user: newUser,
		},
	});
});

//GET ALL USERS
exports.getAllUsers = catchAsync(async (req, res, next) => {
	//if admin -> see everyone
	//if instr -> see only their students

	const users = await prisma.user.findMany({
		where: { active: true },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			rollNumber: true,
			active: true,
		},
	});

	res.status(200).json({
		status: 'success',
		results: users.length,
		data: {
			users,
		},
	});
});

//GET Current User
exports.getMe = catchAsync(async (req, res, next) => {
	req.params.id = req.user.id;
	next();
});

//get any user(ADMIN)
exports.getUser = catchAsync(async (req, res, next) => {
	const user = await prisma.user.findUnique({
		where: {
			id: req.params.id,
		},
	});

	if (!user) {
		return next(new AppError(`No user forund with that id`, 404));
	}

	user.password = undefined;

	res.status(200).json({
		status: 'success',
		data: { user },
	});
});
