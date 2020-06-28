const middlewareHelper = require('../helpers/middleware.helper');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const userService = require('../services/users/user.service');

//yêu cầu tài khoản phải xác nhận Chứng minh nhân dân/Căn cước công dân
module.exports.verifyCitizenIdentificationIdRequired = function(req, res, next) {
	const result = req.session.user.citizenIdentificationId;
	if (result && result.length > 0) return next();
	return res.status(401).send({ message: 'User not verified CitizenIdentificationId yet' });
};

// yêu cầu tài khoản phải xác nhận email
module.exports.verifyEmailRequired = asyncHandler(async function(req, res, next) {
	const result = await userService.checkUserVerifyEmailCodeYet(req.session.user);
	if (result) return next();
	return res.status(401).send({ message: 'User not verified email yet' });
});

// yêu cầu phải là nhân viên của ngân hàng
module.exports.internalUserRequired = function(req, res, next) {
	const result = req.session.user.citizenIdentificationId;
	if (result) return next();
	return res.status(403).send({ message: 'User do not have permission' });
};

// yêu cầu phải đang tình trạng đã logout
module.exports.logoutRequired = function(req, res, next) {
	if (!req.session.user) {
		return next();
	}
	return res.status(403).send({ message: 'User already logged in' });
};

// yêu cầu phải đang tình trạng đã login
module.exports.loginRequired = function(req, res, next) {
	if (req.session.user) {
		return next();
	}
	//khi cố truy cập vào các trang cần login mà lỗi (chưa login) sẽ trả ra 401
	return res.status(401).send({ message: 'User not logged in' });
};

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
	if (token == null) return res.status(401).send({ message: 'Invalid token' });
	console.log(req.body.token);
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.status(401).send({ message: 'Invalid token' });
		next();
	});
};
