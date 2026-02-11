const express = require('express');
const moduleController = require('../controllers/moduleController.js');
const authController = require('../controllers/authController.js');
const quizRouter = require('../routes/quizRoutes.js')

//allows us to access :courseId from Course Router
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

//ROutes: /api/v1/courses/:courseId/modules/

router
	.route('/')
	.get(moduleController.getAllModules)
	.post(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		moduleController.createModule,
	);

//Routes: /api/v1/courses/:courseId/modules/:id
router
	.route('/:id')
	.patch(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		moduleController.updateModule,
	)
	.delete(
		authController.restrictTo('ADMIN', 'INSTRUCTOR'),
		moduleController.deleteModule,
	);


//quiz routes
router.use('/:moduleId/quizzes',quizRouter)
module.exports = router;
