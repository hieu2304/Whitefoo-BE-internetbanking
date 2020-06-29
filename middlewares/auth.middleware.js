const middlewareHelper = require('../helpers/middleware.helper');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const userService = require('../services/users/user.service');

//yêu cầu tài khoản phải xác nhận Chứng minh nhân dân/Căn cước công dân
module.exports.verifyCitizenIdentificationIdRequired = function(req, res, next) {
	const result = currentUser.citizenIdentificationId;
	if (result && result.length > 0) return next();
	return res.status(401).send({ message: 'User not verified CitizenIdentificationId yet' });
};

// yêu cầu tài khoản phải xác nhận email
module.exports.verifyEmailRequired = asyncHandler(async function(req, res, next) {
	const result = await userService.checkUserVerifyEmailCodeYet(currentUser);
	if (result) return next();
	return res.status(401).send({ message: 'User not verified email yet' });
});

// yêu cầu phải là nhân viên của ngân hàng
module.exports.internalUserRequired = function(req, res, next) {
	const result = currentUser.citizenIdentificationId;
	if (result) return next();
	return res.status(403).send({ message: 'User do not have permission' });
};

// yêu cầu phải đang tình trạng đã logout
function logoutRequired(req, res, next) {
	if (!currentUser) {
		return next();
	}
	return res.status(403).send({ message: 'User already logged in' });
}
module.exports.logoutRequired = logoutRequired;

// yêu cầu phải đang tình trạng đã login
function loginRequired(req, res, next) {
	if (currentUser) {
		return next();
	}
	//khi cố truy cập vào các trang cần login mà lỗi (chưa login) sẽ trả ra 401
	return res.status(401).send({ message: 'User not logged in' });
}
module.exports.loginRequired = loginRequired;

// yêu cầu có kèm 2 secret theo(trong ENV)
module.exports.authSecret = function(req, res, next) {
	const secret = middlewareHelper.getSecret();
	if (req.body.clientId != secret[0] || req.body.secretKey != secret[1]) {
		return res.status(403).send({ message: 'Invalid secret code' });
	}
	return next();
};

// yêu cầu có token hợp lệ
module.exports.authToken = function(req, res, next) {
	const token = req.body.token;
	if (token == null) return res.status(401).send({ message: 'Invalid Token' });
	if (checkIsBlackList(token)) return res.status(401).send({ message: 'Invalid Token' });
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, user) {
		if (err) {
			return res.status(401).send({ message: 'Invalid Token' });
		} else {
			return next();
		}
	});
};

function checkIsBlackList(token) {
	if (blackListToken.includes(token)) return true;
	return false;
}
