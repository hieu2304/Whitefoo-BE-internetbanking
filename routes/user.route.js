const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');

router.post('/forgotpassword', controller.postForgotPassword);
router.post('/verifyforgotcode', controller.postForgotPassword);
router.post('/updatenewpassword', controller.postForgotPassword);

module.exports = router;
