const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.loginRequired);

router.get('/idcard', auth.authSecret, asyncHandler(controller.getIdCard));
router.post('/idcard', upload.single('image'), auth.authSecret, asyncHandler(controller.postIdCard));
router.delete('/idcard', auth.authSecret, asyncHandler(controller.deleteIdCard));

module.exports = router;
