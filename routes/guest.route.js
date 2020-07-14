const express = require('express');
const router = express.Router();
const controller = require('../controllers/guest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateHelper = require('../helpers/validate.helper');

//đảm bảo user chưa login, chèn thủ công từng route
//giải thích: vì Route '/' xài chung cho đã login và chưa login nên "use(middleWare) sẽ dành cho đã login"
//chưa login sẽ chèn middleware RequireLogout thủ công tránh lỗi sau khi đã login vẫn dùng middleware này
//router.use(authMiddleware.logoutRequired);

//quên mật khẩu
//B1
router.get('/forgotpassword', authMiddleware.logoutRequired, controller.getForgotPassword);
router.post('/forgotpassword', authMiddleware.logoutRequired, controller.postForgotPassword);
//B2
router.get('/verifyforgotcode', authMiddleware.logoutRequired, controller.getVerifyForgotCode);
router.post('/verifyforgotcode', authMiddleware.logoutRequired, controller.postVerifyForgotCode);
//B3
router.get('/updatenewpassword', authMiddleware.logoutRequired, controller.getUpdateNewPassword);
router.post(
	'/updatenewpassword',
	authMiddleware.logoutRequired,
	validateHelper.validateUpdateNewPassword(),
	controller.postUpdateNewPassword
);

//đăng ký tài khoản
router.get('/register', authMiddleware.logoutRequired, controller.getRegister);
router.post(
	'/register',
	authMiddleware.logoutRequired,
	validateHelper.validateRegisterInformation(),
	controller.postRegister
);

module.exports = router;
