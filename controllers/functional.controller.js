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
//đã chuyển sang guest

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

	const result = await userService.sendVerify(currentUser);
	//khác null nghĩa là có lỗi
	if (result) return res.status(409).json(result);
	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});
//bước 2: chuyển khoản cùng verifycode
module.exports.getTransferInternal = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postTransferInternal = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.transferInternalStepTwo(req.body, currentUser);

	//khác null nghĩa là có lỗi
	if (result) return res.status(400).json(result);

	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});

//user rút tiền có 2 bước, bước 1 xài sendverify
//B2:
module.exports.getWithdraw = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postWithdraw = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	//gọi hàm withdraw(sẽ gửi mail nếu thành công)
	const result = await userService.withdrawStepTwo(req.body, currentUser);

	//khác null nghĩa là có lỗi
	if (result) return res.status(400).json(result);

	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});

//user get self's accounts information
module.exports.postGetAccount = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.getAccount(currentUser, req.body);

	return res.status(200).send(result);
});
module.exports.getGetAccount = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.getAccount(currentUser, req.query);

	return res.status(200).send(result);
});

//get history activities of account
module.exports.getGetLog = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.getLogByUser(currentUser, req.query);

	return res.status(200).send(result);
});
module.exports.postGetLog = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.getLogByUser(currentUser, req.body);

	return res.status(200).send(result);
});
