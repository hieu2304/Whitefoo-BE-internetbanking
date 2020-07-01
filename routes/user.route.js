const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.logoutRequired);
router.post('/forgotpassword', controller.postForgotPassword);
router.post('/verifyforgotcode', controller.postVerifyForgotCode);
router.post('/updatenewpassword', controller.postUpdateNewPassword);
//điều kiện phải login
router.post(
	'/changepassword',
	authMiddleware.loginRequired,
	authMiddleware.authToken,
	authMiddleware.verifyEmailRequired,
	authMiddleware.verifyCitizenIdentificationIdRequired,
	controller.postChangePasswordAfterLogin
);

module.exports = router;
