const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');
const validateHelper = require('../helpers/validate.helper');
const jwtHelper = require('../helpers/jwt.helper');

module.exports.testFunctional = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//user get self's information
//api getinfo đã được chuyển sang guest
//api change password cũng được chuyển sang guest

//User xin làm nhân viên, thằng nào xin trước thằng đó làm
//get: trả ra số count nhân viên hiện tại
//post: xin làm nhân viên, cần gửi kèm id
module.exports.getRequestStaff = asyncHandler(async function(req, res, next) {
	const count = await userService.countStaff();
	return res.status(200).send({ count });
});

module.exports.postRequestStaff = asyncHandler(async function(req, res, next) {
	const result = await userService.requestStaff(req.body);

	//nếu có lỗi
	if (result) return res.status(409).send({ message: result });
	//nếu ok
	return res.status(200).send({ message: 'OK' });
});

//User chuyển khoản nội bộ, có 2 bước
//bước 1: là send mã vào email (bước này dùng chung cho cả nội và liên ngân hàng)
module.exports.getSendVerify = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});
module.exports.postSendVerify = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.transferStepOne(req.body, currentUser);
	//khác null nghĩa là có lỗi
	if (result) return res.status(409).json(result);
	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});
//bước 2: chuyển khoản cùng verifycode
module.exports.getTransferInternal = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});
module.exports.postTransferInternal = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(409).json(errors);
	}

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.transferInternalStepTwo(req.body, currentUser);
	//khác null nghĩa là có lỗi
	if (result) return res.status(409).json(result);
	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});
