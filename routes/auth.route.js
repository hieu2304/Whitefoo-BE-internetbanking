const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//Login
router.get('/login', authMiddleware.logoutRequired, controller.getAuthLogin);
router.post('/login', authMiddleware.logoutRequired, controller.postAuthLoginAIO);

//Logout
router.get('/logout', authMiddleware.loginRequired, controller.getAuthLogout);

//verify Email Code
//API verify Email không cần trạng thái login hay chưa
router.post('/verify', controller.postAuthVerify);

module.exports = router;
