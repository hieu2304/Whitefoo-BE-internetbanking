const express = require('express');
const router = express.Router();
const controller = require('../controllers/functional.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateHelper = require('../helpers/validate.helper');

//some User's functional here, ex: transferring money, withdrawal money.....
router.get('/testfunctional', controller.testFunctional);

//Tính năng người dùng tự đổi mật khẩu
router.get('/changepassword', controller.getChangePasswordAfterLogin);
router.post('/changepassword', validateHelper.validateUpdateNewPassword(), controller.postChangePasswordAfterLogin);

module.exports = router;
