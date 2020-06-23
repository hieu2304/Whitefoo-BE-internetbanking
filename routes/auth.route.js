const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//các HTTP get
router.get('/', authMiddleware.logoutRequired, controller.getAuth);
router.get('/login', authMiddleware.logoutRequired, controller.getAuthLogin);
router.get('/logout', authMiddleware.loginRequired, controller.getAuthLogout);

//các HTTP post
router.post('/login', authMiddleware.logoutRequired, controller.postAuthLoginAIO);
//API verify Email không cần trạng thái login hay chưa
router.post('/verify', controller.postAuthVerify);

module.exports = router;
