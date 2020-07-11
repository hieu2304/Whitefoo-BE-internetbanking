const express = require('express');
const router = express.Router();
const controller = require('../controllers/recaptcha.controller');


app.post('/recaptcha',controller.recaptcha);
module.exports = router;

