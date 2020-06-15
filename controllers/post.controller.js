const asyncHandler = require('express-async-handler');
const postsList = {
	post1: 'this is post 1',
	post2: 'this is post 2'
};

module.exports.getPost = function(req, res, next) {
	return res.json({ message: 'success get the posts list', postsList });
};
