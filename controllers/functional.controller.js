const accountService = require('../services/accounts/account.service');
const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');

module.exports.testFunctional = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.getChangePasswordAfterLogin = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//change password after login success
//currentPassword
//newPassword
//confirmPassword
module.exports.postChangePasswordAfterLogin = asyncHandler(async function(req, res, next) {
	if (req.body.newPassword !== req.body.confirmPassword)
		return res.status(409).send({ message: 'new password not equals to confirmPassword' });

	const result = await userService.changePasswordAfterLogin(req.body);
	if (!result) return res.status(403).send({ message: 'Update failed' });
	return res.status(200).send({ message: 'OK' });
});
