const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');

//		HTTP GET uses on api/auth
module.exports.getAuth = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

module.exports.getAuthLogin = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//khi logout
module.exports.getAuthLogout = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//hàm login bước 1
module.exports.postAuthLoginAIO = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginAIO(req.body);
	if (result.code) return res.status(400).send(result);
	return res.status(200).send(result);
});

//hàm login bước 2
module.exports.postAuthLoginAIOsteptwo = asyncHandler(async function(req, res, next) {
	const result = await userService.authenticationLoginAIOStepTwo(req.body.verifyCode);
	if (!result) {
		return res.status(403).send({ code: 'VERIFYCODE_INVALID', message: 'Invalid or wrong verifyCode' });
	}

	return res.status(200).send(result);
});

//xác minh email lúc đăg ký
module.exports.postAuthActive = asyncHandler(async function(req, res, next) {
	const result = await userService.activeEmailCode(req.body.activeCode);
	if (!result) {
		return res.status(403).send({ message: 'Wrong active code' });
	}
	return res.status(200).send({ message: 'OK' });
});
