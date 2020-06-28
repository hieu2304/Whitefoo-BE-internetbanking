const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.loginRequired);

router.get('/idcard', asyncHandler(controller.getIdCard));
router.post('/idcard', upload.single('image'), asyncHandler(controller.postIdCard));
router.delete('/idcard', asyncHandler(controller.deleteIdCard));

module.exports = router;
