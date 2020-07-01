const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/idcard', auth.authSecret, auth.authAll, asyncHandler(controller.getIdCard));
router.post('/idcard', upload.single('image'), auth.authSecret, auth.authAll, asyncHandler(controller.postIdCard));
router.delete('/idcard', auth.authSecret, auth.authAll, asyncHandler(controller.deleteIdCard));
router.get('/list', auth.authSecret, auth.authAll, asyncHandler(controller.getListBlobs));
router.delete('/list', auth.authSecret, auth.authAll, asyncHandler(controller.deleteListBlobs));

module.exports = router;
