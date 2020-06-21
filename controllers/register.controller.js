const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');

module.exports.getRegister = function(req, res) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.postRegister = asyncHandler(async function(req, res, next) {
	const newUser = await userService.createNewUser(req.body);
	if (typeof newUser === 'string') {
		return res.status(409).send({ message: newUser });
	}
	return res.status(200).send({ message: 'OK' });
});
