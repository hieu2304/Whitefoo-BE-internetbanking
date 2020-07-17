const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');

// Nhân viên tạo tài khoản ngân hàng cho user
module.exports.postCreateAccount = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const userId = typeof req.body.userId !== 'undefined' ? req.body.userId : req.body.id;
	if (!userId) return res.status(409).send({ message: 'id not exist' });

	const checkUser = await userService.findByPk(userId);
	if (!checkUser) return res.status(409).send({ message: 'user not exist' });

	const result = await accountService.createNewAccount(req.body, currentUser);

	if (!result) return res.status(409).send({ message: 'fail' });
	return res.status(200).send(result);
});

// create Account Internal get
module.exports.getCreateAccount = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//search by keyword
module.exports.getSearchKeyword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postSearchKeyword = asyncHandler(async function(req, res, next) {
	if (!req.body.keyword) return res.status(409).send({ message: 'keyword must not empty' });

	const list = await userService.searchByKeyword(req.body);
	return res.status(200).send(list);
});

// getuserinfo
//nhân viên lấy thông tin cá nhân của ai đó + các STK của người đó
module.exports.getGetUserInfo = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postGetUserInfo = asyncHandler(async function(req, res, next) {
	const userId = typeof req.body.userId !== 'undefined' ? req.body.userId : req.body.id;
	if (!userId) return res.status(409).send({ message: 'id not exist' });

	const result = await userService.getUserInfo(req.body);
	if (!result) return res.status(409).send({ message: 'User not found' });
	return res.status(200).send(result);
});

//getaccountinfo
//nhân viên lấy toàn bộ thông tin STK của 1 người nào đó dựa vào accountId
module.exports.getGetAccountInfo = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postGetAccountInfo = asyncHandler(async function(req, res, next) {
	const accountId = typeof req.body.accountId !== 'undefined' ? req.body.accountId : req.body.id;
	if (!accountId) return res.status(409).send({ message: 'not exist Id ' + accountId });
	const result = await accountService.getAccountNoneExclude(accountId);

	if (!result) return res.status(409).send({ message: 'not exist accountId ' + accountId });
	return res.status(200).send(result);
});

//nhân viên nạp tiền vào tài khoản cho 1 tài khoản nhất định
module.exports.postAddBalance = asyncHandler(async function(req, res, next) {
	const accountId = typeof req.body.accountId !== 'undefined' ? req.body.accountId : req.body.id;
	if (!accountId) return res.status(409).send({ message: 'not exist accountId ' + accountId });

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.loadUpBalance(req.body, currentUser);

	if (!result) return res.status(409).send({ message: 'failed' });
	return res.status(200).send({ message: 'OK' });
});


//nhân viên cập nhật thông tin cá nhân cho 1 người dùng nhất định
module.exports.postUpdateInfo = asyncHandler(async function(req, res, next) {
	const userId = typeof req.body.userId !== 'undefined' ? req.body.userId : req.body.id;
	if (!userId) return res.status(409).send({ message: 'not exist userId ' + userdId });

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.updateUserInfo(req.body, currentUser);

	if (!result) return res.status(409).send({ message: 'failed' });
	return res.status(200).send({ message: 'OK' });
});

//nhân viên cập nhật thông tin cho tài khoản nhất định
module.exports.postUpdateAccount= asyncHandler(async function(req, res, next) {
	const accountId = typeof req.body.accountId !== 'undefined' ? req.body.accountId : req.body.id;
	if (!accountId) return res.status(409).send({ message: 'not exist accountId ' + accountId });

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	
	const result = await accountService.updateAccount(req.body, currentUser);

	if (!result) return res.status(409).send({ message: 'failed' });
	return res.status(200).send({ message: 'OK' });
});
