const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');

module.exports.postForgotPassword = function(req, res, next) {
	//some logical here

	//if success
	return res.status(200).send({ message: 'OK' });
};

module.exports.postVerifyForgotCode = function(req, res, next) {
	//some logical here

	//if success
	return res.status(200).send({ message: 'OK' });
};

module.exports.postUpdateNewPassword = function(req, res, next) {
	//some logical here

	//if success
	return res.status(200).send({ message: 'OK' });
};
