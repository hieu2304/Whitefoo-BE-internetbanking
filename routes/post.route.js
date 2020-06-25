const express = require('express');
const router = express.Router();
const controller = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.loginRequired);
router.get('/', controller.getPost);

module.exports = router;
