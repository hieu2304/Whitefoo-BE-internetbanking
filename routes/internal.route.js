const express = require('express');
const router = express.Router();
const controller = require('../controllers/internal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//create new account for user
router.get('/createaccount', controller.getCreateAccount);
router.post('/createaccount', controller.postCreateAccount);

//Internal staff Search User
//search Unique information by keyword
router.get('/searchkeyword', controller.getSearchKeyword);
router.post('/searchkeyword', controller.postSearchKeyword);

router.post('/searchlistuser', controller.searchListUser); //tìm kiếm danh sách các người dùng

router.post('/searchuser', controller.searchUser); //tìm kiếm người dùng theo yêu cầu từ khóa

router.post('/searchuseraccount', controller.searchUserAccount); //tìm kiếm tài khoản của người dùng

router.post('/searchuserbyid', controller.searchUserbyId); //tìm kiếm người dùng bởi thông số id

router.post('/searchaccount', controller.searchAccount); //tìm kiếm tài khoản ngân hàng

router.post('searchaccounthistory', controller.searchAccountHistory); //tìm kiếm lịch sử giao dịch của tài khoản

module.exports = router;
