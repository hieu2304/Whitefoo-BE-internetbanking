const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.logoutRequired, controller.getAuth);
router.post('/login', authMiddleware.logoutRequired, controller.postAuthLogin);
router.get('/logout', authMiddleware.loginRequired, controller.getAuthLogout);


router.get('/login',authMiddleware.loginRequired,controller.getAuthLogin);
module.exports = router;
