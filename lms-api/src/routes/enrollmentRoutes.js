const express = require('express')
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');
const enrollmentMiddleware = require('../middlewares/enrollmentMiddleware'); 

const router = express.Router({mergeParams:true})


//protect all routes for enroll/unenrool
router.use(authController.protect)

//GET my courses ( Dashboard )
//ROUTE GET /v1/enrollments/my-courses
router.get('/my-course',enrollmentController.getMyCourses)

//ENROLL/UNENROLL
//ROUTE POST/DELETE  /v1/courses/:courseId/enroll
router.route('/').post(enrollmentMiddleware.checkEnrollmentPermisson,enrollmentController.enrollStud).delete(enrollmentMiddleware.checkEnrollmentPermisson,enrollmentController.unenroll)
