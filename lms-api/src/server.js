require('dotenv').config();
const app = require('./app');

//Handle Uncaught Exceptions(sync)
process.on('uncaughtException', (err) => {
	console.log('UNCAUGHT EXCEPTION! Shutting down...');
	console.log(err.name, err.message);
	process.exit(1);
});

const port = process.env.PORT || 6999;

const server = app.listen(port, () => {
	console.log(`App running on port ${port}...`);
});

//Handle Unhandled Rejections(async)
process.on('unhandledRejection', (err) => {
	console.log('UNHANDLED REJECTION! Shutting down...');
	console.log(err.name, err.message);
	server.close(() => {
		process.exit(1);
	});
});
