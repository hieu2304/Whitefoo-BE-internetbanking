const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const emailHelper = require('../helpers/email.helper');

//check conflic Username generate Forgot code for User
module.exports.postForgotPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.createForgotCode(req.body.userName);
	if (typeof result === 'string') {
		return res.status(409).send({ message: result })
	}
	return res.status(200).send({ message: 'OK' });
});

//Check Forgotcode
module.exports.postVerifyForgotCode = asyncHandler(async function(req, res, next) {
	const result = await userService.verifyForgotCode(req.body.forgotCode);
	if (!result) {
		return res.status(403).send({ message: 'Wrong forgot Code' });
	}
	return res.status(200).send({ message: 'OK' });
});

//UpdateNewPassword for User with Forgot Code
module.exports.postUpdateNewPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.updateNewpassword(req.body.forgotCode,req.body.password,req.body.confirmPassword);
	if (!result) 
	{
		return res.status(403).send({ message: 'Update failed' });
	}
	return res.status(200).send({ message: 'Update password successfully' });
});

//Login with new Password
module.exports.postLoginNewPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.LoginNewpassword(req.body.password,req.body.Newpassword,req.body.confirmPassword);
	if (!result) 
	{
		return res.status(403).send({ message: 'Update failed' });
	}
	return res.status(200).send({ message: 'Update password successfully' });
});