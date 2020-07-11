const request = require("request");
const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');
module.exports.recaptcha = function(req, res, next){
      
    const token = req.body.recaptcha;
    const recaptchaKey = "RECAPTCHA_KEY";   
    const url =  `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaKey}&response=${token}&remoteip=${req.connection.remoteAddress}`
    
    if(token === null || token === undefined){
      return res.status(401).send({ success: false,message: 'Invalid Token reCaptcha' });
    }
    request(url, function(err, response, body){
      body = JSON.parse(body);
      if(body.success !== undefined && !data.success){
           res.send({success: false, 'message': "recaptcha failed"});
           return res.status(409).send({ message: 'fail' });
       }    
       res.send({"success": true, 'message': "recaptcha passed"});     
    })
    return res.status(200).send({ message: 'OK' });
};