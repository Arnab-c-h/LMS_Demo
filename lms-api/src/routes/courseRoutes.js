const express = require('express');
const courseController = require('../controllers/courseController.js');
const moduleRouter = require('./moduleRoutes.js');
const authController = require('../controllers/authController.js');
const enrollmentRouter = require('../routes/enrollmentRoutes.js');
const quizRouter = require('../routes/quizRoutes.js');

const router = express.Router();

//nested routes
//hits /courses/:courseID/modules -> sent to model Router
router.use('/:courseId/modules', moduleRouter);

//public routes
//lets allow public viewing of courses now
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);

//PROTECTED ROUTES
router.use(authController.protect);

//ENROLLMET ROUTES
router.use('/:courseId/enroll', enrollmentRouter);

//MODULE ROUTRES
router.use('/:courseId/modules', moduleRouter);

//COURSE ROUTES
router.post(
	'/',
	authController.restrictTo('ADMIN', 'INSTRUCTOR'),
	courseController.createCourse,
);

router
	.route('/:id')
	.patch(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		courseController.updateCourse,
	)
	.delete(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		courseController.deleteCourse,
	);

//quiz routes
router.use('/:courseId/quizzes',quizRouter)
module.exports = router;
