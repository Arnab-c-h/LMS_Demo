const express = require('express');
const lessonController = require('../controllers/lessonController.js');
const authController = require('../controllers/authController.js');
const quizRouter = require('../routes/quizRoutes.js');

const router = express.Router({ mergeParams: true });

router.get('/', lessonController.getAllLessons);

//protected routes
router.use(authController.protect);

//mount quizzes
router.use('/:lessonId/quizzes', quizRouter);

//Mark lesson complete
//ROUTE POST /v1/.../lessons/:id/complete
router.post('/:id/complete', lessonController.markLessonComplete);

//create lesson
router.post(
	'/',
	authController.restrictTo('ADMIN', 'INSTRUCTOR'),
	lessonController.createLesson,
);

//get single lesson
router.get('/:id', lessonController.getLesson);

//Update/Delete
router
	.route('/:id')
	.patch(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		lessonController.updateLesson,
	)
	.delete(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		lessonController.deleteLesson,
	);
module.exports = router;
