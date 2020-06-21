const express = require('express');
const router = express.Router();
const controller = require('../controllers/token.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/renew', authMiddleware.loginRequired, controller.renewToken);

module.exports = router;
