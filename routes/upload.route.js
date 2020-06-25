const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/upload.controller');

// Up to 2 images
router.post('/', upload.array('images', 2), controller.postUpload);

module.exports = router;
