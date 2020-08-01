const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const storageService = require('../services/files/storage.service');
const validateHelper = require('../helpers/validate.helper');
const jwtHelper = require('../helpers/jwt.helper');
const middlewareHelper = require('../helpers/middleware.helper');
const exchange_currencyService = require('../services/currency/exchange_currency.service');

//api cập nhật thông tin người dùng
module.exports.postUpdateInfo = asyncHandler(async function(req, res, next) {
	//lấy thông tin user hiện tại thông qua token
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}

	//kiểm tra và update
	const result = await userService.updateSelfInfo(req.body, currentUser);
	// trả ra null là ok
	if (!result) return res.status(200).send({ message: 'OK' });
	return res.status(400).send(result);
});
//sẽ tạm thời ko dùng hàm này, khi người dùng sử dụng method get, sẽ trả ra như api/getinfo
module.exports.getUpdateInfo = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});

//api xem tỷ lệ USD VND cho FE
module.exports.getRate = asyncHandler(async function(req, res, next) {
	const result = await exchange_currencyService.getRate();
	return res.status(200).send(result);
});
module.exports.postRate = asyncHandler(async function(req, res, next) {
	const result = await exchange_currencyService.getRate();
	return res.status(200).send(result);
});

//Forgot password
//step 1 - send request forgot password to generate code and send via email
module.exports.postForgotPassword = asyncHandler(async function(req, res, next) {
	const result = await userService.ForgotPasswordStepOne(req.body);
	if (!result) return res.status(403).send({ message: 'User not exists' });
	return res.status(200).send({ message: 'OK' });
});

module.exports.getForgotPassword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//Check forgotCode
//step 2 - forgot password
module.exports.postVerifyForgotCode = asyncHandler(async function(req, res, next) {
	const result = await userService.verifyForgotCode(req.body.forgotCode);
	if (!result) {
		return res.status(403).send({ message: 'Wrong forgot Code' });
	}
	return res.status(200).send({ message: 'OK' });
});

module.exports.getVerifyForgotCode = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//UpdateNewPassword for User with Forgot Code
//step 3 -forgot password
module.exports.postUpdateNewPassword = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}
	if (!req.body.forgotCode) return res.status(400).send({ message: 'Invalid forgotCode' });

	const result = await userService.ForgotPasswordStepThree(req.body);
	if (!result) {
		return res.status(403).send({ message: 'Update failed' });
	}

	return res.status(200).send({ message: 'OK' });
});

module.exports.getUpdateNewPassword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//Register
module.exports.getRegister = function(req, res) {
	return res.status(201).send({ message: 'OK' });
};

module.exports.postRegister = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors); // lỗi validation
	}

	const newUser = await userService.createNewUser(req.body);

	//if not null, mean errors returned form model's Service, send error for FE
	if (newUser) {
		return res.status(400).send(newUser);
	}

	//if null, mean no errors returned from model's Service = success
	return res.status(201).send({ message: 'OK' });
});

//user get self's information
module.exports.postGetInfo = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const detailsType = req.body.type;
	const result = await userService.getInfoByUser(currentUser, detailsType);

	return res.status(200).send(result);
});

module.exports.getGetInfo = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const detailsType = req.query.type;
	const result = await userService.getInfoByUser(currentUser, detailsType);

	return res.status(200).send(result);
});

//change password after login success
//currentPassword
//newPassword
//confirmPassword
module.exports.postChangePasswordAfterLogin = asyncHandler(async function(req, res, next) {
	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.changePasswordAfterLogin(req.body, currentUser);
	if (!result) return res.status(400).send({ message: 'Update failed' });
	return res.status(200).send({ message: 'OK' });
});
module.exports.getChangePasswordAfterLogin = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//User xin làm nhân viên, thằng nào xin trước thằng đó làm
//get: trả ra số count nhân viên hiện tại
//post: xin làm nhân viên, cần gửi kèm id
module.exports.getRequestStaff = asyncHandler(async function(req, res, next) {
	const count = await userService.countStaff();
	return res.status(200).send({ count });
});
module.exports.postRequestStaff = asyncHandler(async function(req, res, next) {
	var currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	var id = req.body.id;
	if (id) currentUser = req.body;
	const result = await userService.requestStaff(currentUser);

	//nếu có lỗi
	if (result) return res.status(403).send({ message: result });
	//nếu ok
	return res.status(200).send({ message: 'OK' });
});

//user tự update cmnd chờ nhân viên duyệt
module.exports.getUpdateIdCard = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postUpdateIdCard = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const errors = validateHelper.validateErrorHandle(req);
	if (errors) {
		return res.status(400).json(errors);
	}

	const result = await storageService.updateIdCard(req.body, currentUser);

	if (!result) return res.status(200).send({ message: 'OK' });
	return res.status(400).send(result);
});

//user yêu cầu gửi lại mã xác nhận email (activeCode)
module.exports.postResend = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.resendEmailActiveCode(currentUser);
	//{ message: 'User verified Email' }
	if (result) return res.status(400).send(result);

	return res.status(200).send({ message: 'OK' });
});

//ĐỌC KỸ GUIDE TRƯỚC KHI DÙNG API NÀY
//api lắng nghe chuyển tiền liên ngân hàng
module.exports.getListenExternal = function(req, res, next) {
	//check header
	const secret = middlewareHelper.getSecret();
	//header ko có viết hoa
	const clientId = req.headers['clientid'];
	const secretKey = req.headers['secretkey'];

	if (clientId != secret[0] || secretKey != secret[1]) {
		return res.status(403).json(5);
	}

	return res.status(200).send({ message: 'OK' });
};
module.exports.postListenExternal = asyncHandler(async function(req, res, next) {
	//check header
	const secret = middlewareHelper.getSecret();
	//header ko có viết hoa
	const clientId = req.headers['clientid'];
	const secretKey = req.headers['secretkey'];

	if (clientId != secret[0] || secretKey != secret[1]) {
		return res.status(403).json(5);
	}

	const result = await userService.listenExternal(req.body);
	return res.status(200).json(result);
});
