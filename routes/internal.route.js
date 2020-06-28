const express = require('express');
const router = express.Router();
const controller = require('../controllers/internal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.loginRequired);

//create new account for user
router.get('/createaccount', controller.getCreateAccount);
router.post('/createaccount', controller.postCreateAccount);

module.exports = router;
