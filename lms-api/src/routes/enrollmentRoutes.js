const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');
const enrollmentMiddleware = require('../middlewares/enrollmentMiddleware');

const router = express.Router({ mergeParams: true });

//protect all routes for enroll/unenrool
router.use(authController.protect);

//ROUTE GET /v1/enrollments/my-courses
// GET my courses (Dashboard)
// ---------------------------------------------------------
// NOTE: Access this ONLY via /api/v1/enrollments/my-courses
// Do NOT use the nested route /courses/:id/enroll/my-courses
// ---------------------------------------------------------
router.get('/my-courses', enrollmentController.getMyCourses);

//ENROLL/UNENROLL
//ROUTE POST/DELETE  /v1/courses/:courseId/enroll
// ---------------------------------------------------------
// NOTE: Access this via nested route:
// POST /api/v1/courses/:courseId/enroll
// DELETE /api/v1/courses/:courseId/enroll
// ---------------------------------------------------------
router
	.route('/')
	.post(
		enrollmentMiddleware.checkEnrollmentPermisson,
		enrollmentController.enrollStud,
	)
	.delete(
		enrollmentMiddleware.checkEnrollmentPermisson,
		enrollmentController.unenroll,
	);

//View students in  a course
//ROUTE GET /v1/courses/:courseId/enroll/students
router.get(
	'/students',
	enrollmentMiddleware.checkEnrollmentPermisson,
	enrollmentController.getCourseStudents,
);

module.exports = router;
