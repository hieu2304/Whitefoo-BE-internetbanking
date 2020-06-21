const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');

module.exports.getRegister = function(req, res) {
	return res.status(200).json();
};

module.exports.postRegister = asyncHandler(async function(req, res, next) {
	const newUser = await userService.createNewUser(req.body);
	return res.status(200).json();
});
