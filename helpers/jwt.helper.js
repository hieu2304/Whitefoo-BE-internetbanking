const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

module.exports.jwtEx = function(req, res, next) {
	const { secret } = config;
	// 1 só path dưới đây sẽ được miễn yêu cầu token, còn lại nếu ko có token sẽ có thông báo "invalid token
	return expressJwt({ secret }).unless({
		path: [ '/api/auth/login', '/api/register', '/api/auth/logout' ]
	});
};

module.exports.reGenerateToken = function(req, res, next) {
	const previousToken = req.body.token;
	if (previousToken == null) return res.status(403).send({ message: 'Invalid token' });
	jwt.verify(previousToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.status(403).send({ message: 'Invalid token' });
		const token = this.generateToken({
			id: user.id,
			email: user.email,
			citizenIdentificationId: user.citizenIdentificationId,
			lastName: user.lastName,
			firstName: user.firstName,
			phoneNumber: user.phoneNumber
		});

		return res.json({ token: token });
	});
};

module.exports.generateToken = function(user) {
	return (accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' }));
};

module.exports.authToken = function(req, res, next) {
	const token = req.body.token;
	if (token == null) return res.status(401).send({ message: 'Invalid Token' });
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, user) {
		if (err) {
			return res.status(401).send({ message: 'Invalid Token' });
		} else {
			return next();
		}
	});
};