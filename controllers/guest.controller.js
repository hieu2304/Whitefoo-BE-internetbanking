const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const validateRegister = require('../helpers/validate.helper');

//Forgot password
//step 1 - send request forgot password to generate code and send via email
module.exports.postForgotPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.ForgotPasswordStepOne(req.body);
	if (!result) return res.status(403).send({ message: 'User not exists' });
	return res.status(200).send({ message: 'OK' });
});

//Check forgotCode
//step 2 - forgot password
module.exports.postVerifyForgotCode = asyncHandler(async function(req, res, next) {
	const result = await userService.verifyForgotCode(req.body.forgotCode);
	if (!result) {
		return res.status(403).send({ message: 'Wrong forgot Code' });
	}
	return res.status(200).send({ message: 'OK' });
});

//UpdateNewPassword for User with Forgot Code
//step 3 -forgot password
//newPassword
//confirmPassword
//forgotCode
module.exports.postUpdateNewPassword = asyncHandler(async function(req, res, next) {
	if (req.body.newPassword !== req.body.confirmPassword || !forgotCode)
		return res.status(409).send({ message: 'new password not equals to confirmPassword' });
	const result = await userService.ForgotPasswordStepThree(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Update failed' });
	}
	return res.status(200).send({ message: 'OK' });
});

//
//
//Register
module.exports.getRegister = function(req, res) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.postRegister = asyncHandler(async function(req, res, next) {
	const errors = validateRegister.validateErrorHandle(req);
	if (errors) {
		return res.status(409).json(errors);
	}

	const newUser = await userService.createNewUser(req.body);
	if (typeof newUser === 'string') {
		return res.status(409).send({ message: newUser });
	}
	return res.status(200).send({ message: 'OK' });
});
