const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');

module.exports.getAuth = function(req, res, next) {
	return res.status(200).json();
};

module.exports.getAuthLogin = function(req, res, next) {
	return res.status(200).json();
};

module.exports.postAuthLogin = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginbyEmail(req.body);
	req.session.user = result.user.dataValues;
	return res.json({ token: result.token });
});

module.exports.getAuthLogout = function(req, res, next) {
	req.session.user = null;
	return res.status(200).json();
};
