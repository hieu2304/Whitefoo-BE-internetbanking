const express = require('express');
const router = express.Router();
const controller = require('../controllers/guest.controller');

//api lắng nghe, nhận tiền liên ngân hàng
router.get('/listenexternal', controller.getListenExternal);
router.post('/listenexternal', controller.postListenExternal);

module.exports = router;
