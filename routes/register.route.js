const express = require('express');
const router = express.Router();
const controller = require('../controllers/register.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware.logoutRequired, controller.getRegister);
router.post('/', authMiddleware.logoutRequired, controller.postRegister);

module.exports = router;
