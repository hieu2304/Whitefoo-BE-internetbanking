const asyncHandler = require('express-async-handler');

module.exports.postUpload = function(req, res, next) {
	//some logical here

	//if success
	return res.status(200).send({ message: 'OK' });
};
