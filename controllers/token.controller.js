const jwtHelper = require('../helpers/jwt.helper');

module.exports.renewToken = function(req, res, next) {
	jwtHelper.reGenerateToken(req, res, next);
};
