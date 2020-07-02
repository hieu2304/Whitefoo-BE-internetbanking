const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');

// create Account Internal post
module.exports.postCreateAccount = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const result = await accountService.createNewAccount(req.body, currentUser);

	if (!result) return res.status(409).send({ message: 'fail' });
	return res.status(200).send({ message: 'OK' });
});

// create Account Internal get
module.exports.getCreateAccount = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//search by keyword
module.exports.getSearchKeyword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postSearchKeyword = asyncHandler(async function(req, res, next) {
	if (!req.body.keyword) return res.status(409).send({ message: 'keyword must not empty' });
	const list = await userService.searchByKeyword(req.body);
	return res.status(200).send(list);
});

//Internal staff Search List User
module.exports.searchListUser = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});

//Internal staff Search User by request
module.exports.searchUser = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});

//Internal staff Search Account Bank
module.exports.searchAccount = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});

//Internal staff Search User by Id
module.exports.searchUserbyId = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});

//Internal staff Search User's bank account
module.exports.searchUserAccount = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});

//Internal staff Search account's history_payment
module.exports.searchAccountHistory = asyncHandler(async function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
});
