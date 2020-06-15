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
	if (previousToken == null) return res.sendStatus(403);
	jwt.verify(previousToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.sendStatus(403);
		const token = this.generateToken({
			id: user.id,
			email: user.email,
			citizenIdentificationId: user.citizenIdentificationId,
			fullName: user.fullName,
			phoneNumber: user.phoneNumber
		});

		return res.json({ token: token });
	});
};

module.exports.generateToken = function(user) {
	return (accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }));
};

module.exports.authToken = function(req, res, next) {
	const token = req.body.token;
	if (req.body == null || token == null) return res.sendStatus(401);
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, user) {
		if (err) {
			return res.status(403).send({
				message: 'Invalid token'
			});
		} else {
			//console.log(user.phoneNumber);
			return next();
		}
	});
};
