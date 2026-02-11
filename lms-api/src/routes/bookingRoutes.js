const express = require('express');
const bookingController = require('../controllers/bookingController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.use(authController.protect);

// checkout session
//ROUTE -> POST /v1/bookings/checkout-session/:courseId
router.post(
	'/checkout-session/:courseId',
	bookingController.getCheckoutSession,
);

module.exports = router;
