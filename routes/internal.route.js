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

//nhân viên lấy thông tin cá nhân của ai đó + các STK của người đó
router.get('/getuserinfo', controller.getGetUserInfo);
router.post('/getuserinfo', controller.postGetUserInfo);

//getaccountinfo
//nhân viên lấy toàn bộ thông tin các STK của 1 người nào đó
router.get('/getaccountinfo', controller.getGetAccountInfo);
router.post('/getaccountinfo', controller.postGetAccountInfo);

//nhân viên thêm tiền vào tài khoản cho 1 người nào đó 
router.post('addbalance',controller.addBalance);

//nhân viên cập nhật thông tin người dùng nào đó
router.post('updateinfo',controller.updateInfo);
module.exports = router;
