const express = require('express');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

//public routes
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//protect all routes after this
router.use(authController.protect);

//current user roputes
router.get('/me', userController.getMe, userController.getUser);

//admin/Instr routes
router.use(authController.restrictTo('ADMIN', 'INSTRUCTOR'));

router
	.route('/')
	.get(userController.getAllUsers)
	.post(userController.createUser);

router.route('/:id').get(userController.getUser);

module.exports = router;
