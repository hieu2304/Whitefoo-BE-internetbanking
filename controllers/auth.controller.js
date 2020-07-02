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
	blackListToken.push(currentToken);
	return res.status(200).send({ message: 'OK' });
};

//		HTTP POST uses on api/auth
//các hàm login cũ
module.exports.postAuthLoginViaEmail = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginByEmail(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong email or password' });
	}

	return res.status(200).send({ user: result.user.dataValues, token: result.token, message: 'OK' });
});

module.exports.postAuthLoginViaPhoneNumber = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginByPhoneNumber(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong phone number or password' });
	}

	return res.status(200).send({ user: result.user.dataValues, token: result.token, message: 'OK' });
});

module.exports.postAuthLoginViaCitizenIdentificationId = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginByCitizenIdentificationId(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong citizenIdentificationId or password' });
	}

	return res.status(200).send({ user: result.user.dataValues, token: result.token, message: 'OK' });
});

//hàm login xài chính thức
module.exports.postAuthLoginAIO = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginAIO(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Wrong login name or password' });
	}

	return res.status(200).send({
		token: result.token,
		message: 'OK'
	});
});

module.exports.postAuthActive = asyncHandler(async function(req, res, next) {
	const result = await userService.activeEmailCode(req.body.activeCode);
	if (!result) {
		return res.status(403).send({ message: 'Wrong active code' });
	}
	return res.status(200).send({ message: 'OK' });
});
