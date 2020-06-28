const express = require('express');
const router = express.Router();
const controller = require('../controllers/functional.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.loginRequired);

//some User's functional here, ex: transferring money, withdrawal money.....
router.get('/testfunctional', controller.testFunctional);

module.exports = router;
