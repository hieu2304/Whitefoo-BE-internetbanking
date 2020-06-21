const middlewareHelper = require('../helpers/middleware.helper');
const jwt = require('jsonwebtoken');

module.exports.logoutRequired = function(req, res, next) {
	if (!req.session.user) {
		return next();
	}
	return res.sendStatus(403).send({ message: 'User already logged in' });
};
module.exports.loginRequired = function(req, res, next) {
	if (req.session.user) {
		return next();
	}
	return res.sendStatus(403).send({ message: 'User not logged in' });
};

module.exports.authSecret = function(req, res, next) {
	const secret = middlewareHelper.getSecret();
	if (req.body.clientId != secret[0] || req.body.secretKey != secret[1]) {
		return res.sendStatus(403).send({ message: 'Invalid secret code' });
	}
	return next();
};

module.exports.authToken = function(req, res, next) {
	const token = req.body.token;
	if (token == null) return res.sendStatus(401).send({ message: 'Invalid token' });
	console.log(req.body.token);
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.sendStatus(401).send({ message: 'Invalid token' });
		next();
	});
};
