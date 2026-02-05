const express = require('express');
const lessonController = require('../controllers/lessonController.js');
const authCOntroller = require('../controllers/authController.js');

const router = express.Router({ mergeParams: true });


router.use
