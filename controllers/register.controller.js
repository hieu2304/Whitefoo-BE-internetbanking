const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');
const validateRegister = require('../helpers/validate.helper');

module.exports.getRegister = function(req, res) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.postRegister = asyncHandler(async function(req, res, next) {
	const errors = validateRegister.validateErrorHandle(req);
	if (true) {
		return res.status(409).json(errors);
	}

	const newUser = await userService.createNewUser(req.body);
	if (typeof newUser === 'string') {
		return res.status(409).send({ message: newUser });
	}
	return res.status(200).send({ message: 'OK' });
});
