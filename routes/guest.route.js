const express = require('express');
const router = express.Router();
const controller = require('../controllers/guest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateHelper = require('../helpers/validate.helper');

//đảm bảo user chưa login
router.use(authMiddleware.logoutRequired);

//quên mật khẩu
router.get('/forgotpassword', controller.getForgotPassword);
router.get('/verifyforgotcode', controller.getVerifyForgotCode);
router.get('/updatenewpassword', controller.getUpdateNewPassword);
router.post('/forgotpassword', controller.postForgotPassword);
router.post('/verifyforgotcode', controller.postVerifyForgotCode);
router.post('/updatenewpassword', validateHelper.validateUpdateNewPassword(), controller.postUpdateNewPassword);

//đăng ký tài khoản
router.get('/register', controller.getRegister);
router.post('/register', validateHelper.validateRegisterInformation(), controller.postRegister);

module.exports = router;
