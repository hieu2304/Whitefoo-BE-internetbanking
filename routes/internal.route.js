const express = require('express');
const router = express.Router();
const controller = require('../controllers/internal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//create new account for user
router.get('/createaccount', controller.getCreateAccount); ////tạo tài khoản nhân viên qua HTTP Get

router.post('/createaccount', controller.postCreateAccount); //tạo tài khoản nhân viên qua HTTP Post

//Internal staff Search User
router.post('/searchlistuser', controller.searchListUser); //tìm kiếm danh sách các người dùng

router.post('/searchuser', controller.searchUser); //tìm kiếm người dùng theo yêu cầu từ khóa

router.post('/searchuseraccount', controller.searchUserAccount); //tìm kiếm tài khoản của người dùng

router.post('/searchuserbyid', controller.searchUserbyId); //tìm kiếm người dùng bởi thông số id

router.post('/searchaccount', controller.searchAccount); //tìm kiếm tài khoản ngân hàng

router.post('searchaccounthistory', controller.searchAccountHistory); //tìm kiếm lịch sử giao dịch của tài khoản

module.exports = router;
