const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync.js');
const AppError = require('../utils/appError.js');
const { Prisma } = require('@prisma/client/extension');
const { sign } = require('crypto');

const prisma = new PrismaClient();

//Helper - Sign JWT
const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
		algorithm: 'HS256',
	});
};

//Helper - crerate and send token
//where do we get iska documentiation
const createSendToken = (user, statusCode, res) => {
	const token = signToken(user.id);

	const cookieOptions = {
		expires: new Date(
			Date.now() +
				process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
		),
		httpOnly: true, //secure,JS cant access cookie
	};

	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //https only no http

	res.cookie('jwt', token, cookieOptions);

	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user,
		},
	});
};

//LOGIN MODULE
exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	//1)check email and pwd
	if (!email || !password) {
		return next(new AppError('Please provide email, password', 400));
	}

	//2)Check if user exists and pwd is correct
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401));
	}

	//3)Check if user is still active
	if (!user.active) {
		return next(new AppError('This account has been deactivated', 401));
	}

	//4)Send Token
	createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});
	res.status(200).json({ status: 'success' });
};

//Auth Middleware
exports.protect = catchAsync(async (req, res, next) => {
	//1)Get token and check if there
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(new AppError(`NOT LOGGIN IN `, 401));
	}

	//2)Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	//3)Check if user exists
	const currentUser = await prisma.user.findUnique({
		where: { id: decoded.id },
	});

	if (!currentUser) {
		return next(
			new AppError(`User belonging to this token no longer exists`, 401),
		);
	}

	//4)Check if user changed password after token issued
	if (currentUser.passwordChangedAt) {
		const changedTimestamp = parseInt(
			currentUser.passwordChangedAt.getTime() / 1000,
			10,
		);
		if (changedTimestamp > decoded.iat) {
			return next(
				new AppError(`User changed pwd recently, login again`, 401),
			);
		}
	}

	//Grant Access to PROTECTED ROUTES
	req.user = currentUser;
	next();
});

//RESTRICT TO - Auth
//restricTo (ADMIN,INSTR)
exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError(`No permission to perfom this action`, 403),
			);
		}
		next();
	};
};
