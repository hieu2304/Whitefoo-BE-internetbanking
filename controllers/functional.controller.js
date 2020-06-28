const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');

module.exports.testFunctional = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
