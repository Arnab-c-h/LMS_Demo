const AppError = require('../utils/appError.js');

// Handle Prisma Unique Constraint Violation (eg Duplicate Email/RollNo)
const handlePrismaUniqueError = (err) => {
	const field = err.meta.target.join(', ');
	const message = `Duplicate field value: ${field}. Please use another value!`;
	return new AppError(message, 400);
};

//Handle Prisma Validation Error
const handlePrismaValidationError = (err) => {
	return new AppError(`Invalid input data : ${err.message}`, 400);
};

const handleJWTError = () => {
	return new AppError(`Invalid token! Please login again`, 401);
};

const handleJWTExpiredError = () => {
	return new AppError(`Your token has expired!Please login again`, 401);
};

const sendErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	});
};

const sendErrorProd = (err, res) => {
	//operatiunal error (send to client)
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	} else {
		console.error('ERROR!!!!', err);

		res.status(500).json({
			status: 'error',
			message: 'something went very wrong',
		});
	}
};

module.exports = (err, req, res, next) => {
	//default vbalues
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
		sendErrorDev(err, res);
	} else if (process.env.NODE_ENV === 'production') {
		//clone error obj
		let error = { ...err };
		error.message = err.message;

		//prisma error codes
		if (err.code === 'P2002') error = handlePrismaUniqueError(err);
		if (err.code === 'P2003')
			error = new AppError('Foreign key constraint failed.', 400);

		// JWT Errors
		if (err.name === 'JsonWebTokenError') error = handleJWTError();
		if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

		sendErrorProd(error, res);
	}
};
