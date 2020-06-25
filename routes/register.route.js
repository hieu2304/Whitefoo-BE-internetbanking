const express = require('express');
const router = express.Router();
const controller = require('../controllers/register.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validateRegister = require('../helpers/validate.helper');

router.use(authMiddleware.logoutRequired);
router.get('/', controller.getRegister);
router.post('/', validateRegister.validateRegisterInformation(), controller.postRegister);

module.exports = router;
