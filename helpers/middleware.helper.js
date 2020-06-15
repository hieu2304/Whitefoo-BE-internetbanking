module.exports.getSecret = function() {
	const key = [ process.env.CLIENT_ID, process.env.SECRET_KEY ];
	return key;
};
