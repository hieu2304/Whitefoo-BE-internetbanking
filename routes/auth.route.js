const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//Login
router.get('/login', authMiddleware.logoutRequired, controller.getAuthLogin);
router.post('/login', authMiddleware.logoutRequired, controller.postAuthLoginAIO);
router.post('/verify2fa', authMiddleware.logoutRequired, controller.postAuthLoginAIOsteptwo);

//Logout
router.get('/logout', controller.getAuthLogout);

//verify Email Code
//API verify Email không cần trạng thái login hay chưa
router.post('/active', controller.postAuthActive);

module.exports = router;
