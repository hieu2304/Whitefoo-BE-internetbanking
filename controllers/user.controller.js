const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const emailHelper = require('../helpers/email.helper');

//check conflic Username generate Forgot code for User
//step 1 - forgot password
module.exports.postForgotPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.ForgotPasswordStepOne(req.body);
	if (!result) return res.status(403).send({ message: 'User not exists' });
	return res.status(200).send({ message: 'OK' });
});

//Check Forgotcode
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
//newpassword
//confirmpassword
//forgotCode
module.exports.postUpdateNewPassword = asyncHandler(async function(req, res, next) {
	if (req.body.newpassword !== req.body.confirmpassword || !forgotCode)
		return res.status(409).send({ message: 'new password not equals to confirmpassword' });
	const result = await userService.ForgotPasswordStepThree(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Update failed' });
	}
	return res.status(200).send({ message: 'OK' });
});

//change password after login success
//currentpassword
//newpassword
//confirmpassword
module.exports.postChangePasswordAfterLogin = asyncHandler(async function(req, res, next) {
	if (req.body.newpassword !== req.body.confirmpassword)
		return res.status(409).send({ message: 'new password not equals to confirmpassword' });

	const result = await userService.changePasswordAfterLogin(req.body);
	if (!result) return res.status(403).send({ message: 'Update failed' });
	return res.status(200).send({ message: 'OK' });
});
