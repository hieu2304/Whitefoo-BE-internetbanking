const express = require('express');
const router = express.Router();
const controller = require('../controllers/recaptcha.controller');

router.post('/', controller.reCaptchaV2_ReceivingAndValidating);
module.exports = router;
