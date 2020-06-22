const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');

//		HTTP GET uses on api/auth
module.exports.getAuth = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.getAuthLogin = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.getAuthLogout = function(req, res, next) {
	req.session.user = null;
	req.session.token = null;
	return res.status(200).send({ message: 'OK' });
};

//		HTTP POST uses on api/auth
module.exports.postAuthLoginViaEmail = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginByEmail(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong email or password' });
	}
	req.session.user = result.user.dataValues;
	req.session.token = result.token;
	return res.status(200).send({ token: result.token, message: 'OK' });
});

module.exports.postAuthLoginViaPhoneNumber = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginByPhoneNumber(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong phone number or password' });
	}
	req.session.user = result.user.dataValues;
	req.session.token = result.token;
	return res.status(200).send({ token: result.token, message: 'OK' });
});

module.exports.postAuthLoginViaCitizenIdentificationId = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginByCitizenIdentificationId(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong citizenIdentificationId or password' });
	}
	req.session.user = result.user.dataValues;
	req.session.token = result.token;
	return res.status(200).send({ token: result.token, message: 'OK' });
});
module.exports.postAuthLoginAIO = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginAIO(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong username or password' });
	}
	req.session.user = result.user.dataValues;
	req.session.token = result.token;
	return res.status(200).send({ token: result.token, message: 'OK' });
});