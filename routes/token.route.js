const express = require('express');
const router = express.Router();
const controller = require('../controllers/token.controller');

router.post('/renew-token', controller.renewToken);

module.exports = router;
