const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');
const asyncHandler = require('express-async-handler');

module.exports.renewToken = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.reGenerateToken(currentUser);
	return res.status(200).send(result);
});
