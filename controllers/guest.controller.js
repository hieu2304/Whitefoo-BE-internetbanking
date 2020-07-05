const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const validateHelper = require('../helpers/validate.helper');

//Forgot password
//step 1 - send request forgot password to generate code and send via email
module.exports.postForgotPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.ForgotPasswordStepOne(req.body);
	if (!result) return res.status(403).send({ message: 'User not exists or not verify email yet' });
	return res.status(200).send({ message: 'OK' });
});

module.exports.getForgotPassword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//Check forgotCode
//step 2 - forgot password
module.exports.postVerifyForgotCode = asyncHandler(async function(req, res, next) {
	const result = await userService.verifyForgotCode(req.body.forgotCode);
	if (!result) {
		return res.status(403).send({ message: 'Wrong forgot Code' });
	}
	return res.status(200).send({ message: 'OK' });
});

module.exports.getVerifyForgotCode = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//UpdateNewPassword for User with Forgot Code
//step 3 -forgot password
//this step required a validation
//newPassword
//confirmPassword
//forgotCode
module.exports.postUpdateNewPassword = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(409).json(errors);
	}
	if (!req.body.forgotCode) return res.status(403).send({ message: 'Invalid forgotCode' });

	const result = await userService.ForgotPasswordStepThree(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Update failed' });
	}

	return res.status(200).send({ message: 'OK' });
});

module.exports.getUpdateNewPassword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//
//
//
//
//Register
module.exports.getRegister = function(req, res) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.postRegister = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(409).json(errors);
	}

	const newUser = await userService.createNewUser(req.body);

	//if not null, mean errors returned form model's Service, send error for FE
	if (newUser) {
		return res.status(409).send(newUser);
	}

	//if null, mean no errors returned from model's Service = success
	return res.status(200).send({ message: 'OK' });
});
