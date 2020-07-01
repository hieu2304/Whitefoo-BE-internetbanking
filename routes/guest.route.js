const express = require('express');
const router = express.Router();
const controller = require('../controllers/guest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateRegister = require('../helpers/validate.helper');

//đảm bảo user chưa login
router.use(authMiddleware.logoutRequired);

//quên mật khẩu
router.post('/forgotpassword', controller.postForgotPassword);
router.post('/verifyforgotcode', controller.postVerifyForgotCode);
router.post('/updatenewpassword', controller.postUpdateNewPassword);

//đăng ký tài khoản
router.get('/register', controller.getRegister);
router.post('/register', validateRegister.validateRegisterInformation(), controller.postRegister);

module.exports = router;
