const accountService = require('../services/accounts/account.service');
const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');
const validateHelper = require('../helpers/validate.helper');
const jwtHelper = require('../helpers/jwt.helper');

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
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(409).json(errors);
	}

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.changePasswordAfterLogin(req.body, currentUser);
	if (!result) return res.status(403).send({ message: 'Update failed' });
	return res.status(200).send({ message: 'OK' });
});
