const express = require('express');
const router = express.Router();
const controller = require('../controllers/token.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.loginRequired);
router.post('/renew', controller.renewToken);

module.exports = router;
