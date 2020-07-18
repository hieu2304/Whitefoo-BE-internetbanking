const express = require('express');
const router = express.Router();
const controller = require('../controllers/guest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateHelper = require('../helpers/validate.helper');

//đảm bảo user chưa login, chèn thủ công từng route
//giải thích: vì Route '/' xài chung cho đã login và chưa login nên "use(middleWare) sẽ dành cho đã login"
//chưa login sẽ chèn middleware RequireLogout thủ công tránh lỗi sau khi đã login vẫn dùng middleware này
//router.use(authMiddleware.logoutRequired);

//api xem tỷ lệ USD VND cho FE
router.get('/rate', controller.getRate);
router.post('/rate', controller.postRate);

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

//lấy thông tin cá nhân
//trước kia ở functional
router.get('/getinfo', authMiddleware.authToken, authMiddleware.loginRequired, controller.getGetInfo);
router.post('/getinfo', authMiddleware.authToken, authMiddleware.loginRequired, controller.postGetInfo);

//lấy thông tin tài khoản chính mình
router.get('/getaccount', authMiddleware.authToken, authMiddleware.loginRequired, controller.getGetAccount);
router.post('/getaccount', authMiddleware.authToken, authMiddleware.loginRequired, controller.postGetAccount);

//đổi mật khẩu sau khi login
//trước kia ở functional
router.get(
	'/changepassword',
	authMiddleware.authToken,
	authMiddleware.loginRequired,
	controller.getChangePasswordAfterLogin
);
router.post(
	'/changepassword',
	authMiddleware.authToken,
	authMiddleware.loginRequired,
	validateHelper.validateUpdateNewPassword(),
	controller.postChangePasswordAfterLogin
);

//User xin làm nhân viên, thằng nào xin trước thằng đó làm
//yêu đã xác nhận email, ko cần đã xác nhận cmnd
router.get(
	'/requeststaff',
	authMiddleware.authToken,
	authMiddleware.loginRequired,
	authMiddleware.verifyEmailRequired,
	controller.getRequestStaff
);
router.post(
	'/requeststaff',
	authMiddleware.authToken,
	authMiddleware.loginRequired,
	authMiddleware.verifyEmailRequired,
	controller.postRequestStaff
);

//user update CMND của mình để chờ nhân viên duyệt
//yêu đã xác nhận email, ko cần đã xác nhận cmnd
//phải có validate check cmnd
router.get(
	'/updateidcard',
	authMiddleware.authToken,
	authMiddleware.loginRequired,
	authMiddleware.verifyEmailRequired,
	controller.getUpdateIdCard
);
router.post(
	'/updateidcard',
	authMiddleware.authToken,
	authMiddleware.loginRequired,
	authMiddleware.verifyEmailRequired,
	validateHelper.validateUpdateIdCard(),
	controller.postUpdateIdCard
);

module.exports = router;
