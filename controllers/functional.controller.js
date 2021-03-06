const userService = require('../services/users/user.service');
const asyncHandler = require('express-async-handler');
const validateHelper = require('../helpers/validate.helper');
const jwtHelper = require('../helpers/jwt.helper');
const accountService = require('../services/accounts/account.service');
const whitelistService = require('../services/partner/whitelist.service');

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

//lấy lịch sử của các tài khoản của chính mình
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

//getaccountinfo
//nhân viên/người dùng lấy toàn bộ thông tin STK dựa vào accountId
module.exports.getGetAccountInfo = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.getAccountInfoByEveryone(req.query, currentUser);

	if (!result) return res.status(403).send({ message: 'account not found' });
	return res.status(200).send(result);
});
module.exports.postGetAccountInfo = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.getAccountInfoByEveryone(req.body, currentUser);

	if (!result) return res.status(403).send({ message: 'account not found' });
	return res.status(200).send(result);
});

//lấy danh sách ngân hàng liên kết
module.exports.getGetBankList = asyncHandler(async function(req, res, next) {
	const result = await whitelistService.getWhiteListExclude();
	return res.status(200).send(result);
});

//lấy danh sách ngân hàng
module.exports.postGetBankList = asyncHandler(async function(req, res, next) {
	const result = await whitelistService.getWhiteListExclude();
	return res.status(200).send(result);
});

//chuyển liên ngân hàng
module.exports.getTransferExternal = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postTransferExternal = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	await userService.transferExternalStepTwo(req.body, currentUser, res);
});

//lãi dự tính của tài khoản tiết kiệm
module.exports.postGetProfit = asyncHandler(async function(req, res, next) {
	const result = await accountService.profitCalculateForAccumulated(req.body);
	return res.status(200).send(result);
});
module.exports.getGetProfit = asyncHandler(async function(req, res, next) {
	const result = await accountService.profitCalculateForAccumulated(req.query);
	return res.status(200).send(result);
});

//tính phí dự kiến của tài khoản thanh toán khi chuyển khoản
module.exports.getGetFee = asyncHandler(async function(req, res, next) {
	const result = await accountService.feeCalculateForPayment(
		req.query.accountId,
		req.query.money,
		req.query.transferType
	);

	return res.status(200).send({ fee: result });
});
module.exports.postGetFee = asyncHandler(async function(req, res, next) {
	const result = await accountService.feeCalculateForPayment(
		req.body.accountId,
		req.body.money,
		req.body.transferType
	);

	return res.status(200).send({ fee: result });
});

//api getarr
module.exports.getGetArr = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await accountService.getAccountListFilterByType(currentUser.id, req.query.type);

	return res.status(200).send(result);
});
module.exports.postGetArr = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await accountService.getAccountListFilterByType(currentUser.id, req.body.type);

	return res.status(200).send(result);
});
