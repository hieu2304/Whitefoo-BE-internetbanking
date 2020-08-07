const express = require('express');
const router = express.Router();
const controller = require('../controllers/functional.controller');
const validateHelper = require('../helpers/validate.helper');

//some User's functional here, ex: transferring money, withdrawal money.....
//router.get('/testfunctional', controller.testFunctional);

//Tính năng người dùng tự đổi mật khẩu
//đã chuyển qua guest vì ko cần yêu cầu đã xác nhận CMND, email

//User lấy thông tin cá nhân của mình : các thông tin cơ bản + thông tin các STK
// đã chuyển qua guest

//User xin làm nhân viên, thằng nào xin trước thằng đó làm
// đã chuyển qua guest

//User chuyển khoản (chỉ chuyển và nhận bằng tài khoản thanh toán)
//B1: send verifyCode
router.get('/sendverify', controller.getSendVerify);
router.post('/sendverify', controller.postSendVerify);
//B2 verify the Code then transfer, sử dụng validate của transfer
router.get('/transferinternal', controller.getTransferInternal);
router.post('/transferinternal', validateHelper.validateTransfer(), controller.postTransferInternal);

//User rút tiền (B1 xài sendverify), sử dụng validate của withdraw
router.get('/withdraw', controller.getWithdraw);
router.post('/withdraw', validateHelper.validateWithdraw(), controller.postWithdraw);

//lấy thông tin tài khoản chính mình
router.get('/getaccount', controller.getGetAccount);
router.post('/getaccount', controller.postGetAccount);

//lấy danh sách tài khoản (ko paging) theo loại tài khoản
router.get('/getarr', controller.getGetArr);
router.post('/getarr', controller.postGetArr);

//get history log account
router.get('/getlog', controller.getGetLog);
router.post('/getlog', controller.postGetLog);

//get bankList
router.get('/getbanklist', controller.getGetBankList);
router.post('/getbanklist', controller.postGetBankList);

//chuyển khoản liên ngân hàng
router.get('/transferexternal', controller.getTransferExternal);
router.post('/transferexternal', validateHelper.validateTransfer(), controller.postTransferExternal);

//tính lãi dự kiến của tài khoản tiết kiệm
router.get('/profit', controller.getGetProfit);
router.post('/profit', controller.postGetProfit);

//tính phí chuyển khoản dự kiến
router.get('/fee', controller.getGetFee);
router.post('/fee', controller.postGetFee);

module.exports = router;
