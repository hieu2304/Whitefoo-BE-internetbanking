const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');

router.post('/forgotpassword', controller.postForgotPassword);
router.post('/verifyforgotcode', controller.postVerifyForgotCode);
router.post('/updatenewpassword', controller.postUpdateNewPassword);

module.exports = router;
