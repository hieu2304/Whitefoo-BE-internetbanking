const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');

// Id Card
router.get('/idcard', auth.authSecret, auth.authToken, asyncHandler(controller.getIdCard));
router.post('/idcard', upload.single('idcard'), auth.authSecret, auth.authToken, asyncHandler(controller.postIdCard));
router.delete('/idcard', auth.authSecret, auth.authToken, asyncHandler(controller.deleteIdCard));
router.get('/idcards', auth.authSecret, auth.authToken, asyncHandler(controller.getIdCards));
router.delete('/idcards', auth.authSecret, auth.authToken, asyncHandler(controller.deleteIdCards));
// Avatar
router.get('/avatar', auth.authSecret, auth.authToken, asyncHandler(controller.getAvatar));
router.post('/avatar', upload.single('avatar'), auth.authSecret, auth.authToken, asyncHandler(controller.postAvatar));
router.put('/avatar', upload.single('avatar'), auth.authSecret, auth.authToken, asyncHandler(controller.putAvatar));
router.delete('/avatar', auth.authSecret, auth.authToken, asyncHandler(controller.deleteAvatar));
// Dev routes only for testing
router.get('/list', auth.authSecret, auth.authToken, asyncHandler(controller.getListBlobs));
router.delete('/list', auth.authSecret, auth.authToken, asyncHandler(controller.deleteListBlobs));

module.exports = router;
