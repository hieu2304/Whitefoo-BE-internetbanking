const express = require('express');
const router = express.Router();
const controller = require('../controllers/upload.controller');

router.post('/', controller.postUpload);

module.exports = router;
