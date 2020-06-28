const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');

module.exports.postCreateAccount = asyncHandler(async function(req, res, next) {
	return res.json({ message: 'success get into post Create account', postsList });
});

module.exports.getCreateAccount = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
