const middlewareHelper = require('../helpers/middleware.helper');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');

//yêu cầu tài khoản phải xác nhận Chứng minh nhân dân/Căn cước công dân
module.exports.verifyCitizenIdentificationIdRequired = asyncHandler(async function(req, res, next) {
	const currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.checkUserApprovedYet(currentUser);
	if (result) return next();
	return res.status(403).send({ message: 'User not verified CitizenIdentificationId yet' });
});

// yêu cầu tài khoản phải xác nhận email
module.exports.verifyEmailRequired = asyncHandler(async function(req, res, next) {
	const currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.checkUserActiveEmailCodeYet(currentUser);
	if (result) return next();
	return res.status(403).send({ message: 'User not verified email yet' });
});

// yêu cầu phải là nhân viên của ngân hàng
module.exports.internalUserRequired = asyncHandler(async function(req, res, next) {
	const currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.checkInternalUser(currentUser);
	if (result) return next();
	return res.status(403).send({ message: 'User do not have permission' });
});

// yêu cầu phải đang tình trạng đã logout
function logoutRequired(req, res, next) {
	if (!req.headers['token']) {
		return next();
	}
	return res.status(403).send({ message: 'User already logged in' });
}
module.exports.logoutRequired = logoutRequired;

// yêu cầu phải đang tình trạng đã login
function loginRequired(req, res, next) {
	if (req.headers['token']) {
		return next();
	}
	//khi cố truy cập vào các trang cần login mà lỗi (chưa login) sẽ trả ra 401
	return res.status(401).send({ message: 'User not logged in' });
}
module.exports.loginRequired = loginRequired;

// yêu cầu có kèm 2 secret theo(trong ENV)
module.exports.authSecret = function(req, res, next) {
	const secret = middlewareHelper.getSecret();
	const clientId = req.headers['clientId'];
	const secretKey = req.headers['secretKey'];
	if (clientId != secret[0] || secretKey != secret[1]) {
		return res.status(400).send({ message: 'Invalid secret code' });
	}
	return next();
};

//yêu cầu phải đang tình trạng đã login và yêu cầu có token hợp lệ
module.exports.authToken = function(req, res, next) {
	const token = req.headers['token'];
	if (!token) return res.status(401).send({ message: 'User not logged in' });

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, user) {
		if (err) {
			return res.status(401).send({ message: 'Invalid Token' });
		} else {
			return next();
		}
	});
};

// hàm này tổng hợp yêu cầu theo thứ tự sau:
//token + logged in -> email verify -> citizenIdentificationId verify
module.exports.authAll = asyncHandler(async function(req, res, next) {
	//token check
	const token = req.headers['token'];

	//logged in check
	if (!token) {
		//khi cố truy cập vào các trang cần login mà lỗi (chưa login) sẽ trả ra 401
		return res.status(401).send({ message: 'User not logged in' });
	}

	var errTemp;
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, user) {
		if (err) {
			errTemp = err;
		}
	});
	if (errTemp) return res.status(401).send({ message: 'Invalid Token' });

	//nếu token hợp lệ thì decode ra lấy thông tin
	const currentUser = jwtHelper.decodeToken(token);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	//email verified check
	const checkEmailVerify = await userService.checkUserActiveEmailCodeYet(currentUser);
	if (!checkEmailVerify) return res.status(403).send({ message: 'User not verified email yet' });

	//citizenIdentificationId verified check
	const checkApprove = await userService.checkUserApprovedYet(currentUser);
	if (!checkApprove) return res.status(403).send({ message: 'User not verified CitizenIdentificationId yet' });

	//if user passed all verify actions -> success
	return next();
});
