const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const controller = require('../controllers/upload.controller');

router.get('/', controller.getUpload);
// Up to 2 images
router.post('/', upload.array('images', 2), controller.postUpload);
router.delete('/', controller.deleteUpload);

module.exports = router;
