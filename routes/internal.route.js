const express = require('express');
const router = express.Router();
const controller = require('../controllers/internal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//create new account for user
router.get('/createaccount', controller.getCreateAccount);
router.post('/createaccount', controller.postCreateAccount);

//tìm kiếm thông tin dựa vào keyword bất kỳ
//trả ra list thông tin cá nhân của các user liên quan keyword
//search Unique information by keyword
router.get('/searchkeyword', controller.getSearchKeyword);
router.post('/searchkeyword', controller.postSearchKeyword);

//nhân viên lấy thông tin cá nhân của ai đó
router.get('/getuserinfo', controller.getGetUserInfo);
router.post('/getuserinfo', controller.postGetUserInfo);

//hàm nhân viên lấy danh sách tài khoản của 1 user
router.get('/getuseraccount', controller.getGetUserAccount);
router.post('/getuseraccount', controller.postGetUserAccount);

//getaccountinfo
//nhân viên lấy toàn bộ thông tin các STK của 1 người nào đó
router.get('/getaccountinfo', controller.getGetAccountInfo);
router.post('/getaccountinfo', controller.postGetAccountInfo);

//nhân viên thêm tiền vào tài khoản cho 1 người nào đó
router.post('/addbalance', controller.postAddBalance);
router.get('/addbalance', controller.getAddBalance);

//nhân viên cập nhật thông tin người dùng nào đó
router.post('/updateuserinfo', controller.postUpdateUserInfo);
router.get('/updateuserinfo', controller.getUpdateUserInfo);

//nhân viên cập nhật tài khoản
router.post('/updateaccount', controller.postUpdateAccount);

//nhân viên duyệt hoặc từ chối 1 người dùng nhất định
//get là lấy list đang chờ duyệt, post là phê duyệt
router.get('/verifyuser', controller.getVerifyUser);
router.post('/verifyuser', controller.postVerifyUser);

module.exports = router;
