const express = require('express');
const quizController = require('../controllers/quizController.js');
const authController = require('../controllers/authController.js');

//merge params to see courseId,moduleId,lessonId
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

//ROUTE .../quizzes/
router
	.route('/')
	.get(quizController.getAllQuizzes)
	.post(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		quizController.createQuiz,
	);

//ID ROUTE .../quizzes/:quizId
router.route('/:quizId').get(quizController.getQuiz);
// .patch(
// 	authController.restrictTo('ADMIN', 'INSTRUCTOR'),
// 	quiController.update,
// );
// .delete(authController.restrictTo('ADMIN', 'INSTRUCTOR'),quizController.);

//add questions
//ROUTE .../quizzes/:quizId/questions
router.post(
	'/:quizId/questions',
	authController.restrictTo('ADMIN', 'INSTRUCTOR'),
	quizController.addQuestion,
);

//Attempt a quiz
//ROUTE .../:quizId/attempt
router.post('/:quizId/attempt', quizController.attemptQuiz);

module.exports = router;
