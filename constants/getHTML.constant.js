var fs = require('fs');

function readModuleFile(path, callback) {
	try {
		var filename = require.resolve(path);
		fs.readFile(filename, 'utf8', callback);
	} catch (e) {
		callback(e);
	}
}

module.exports.getHTMLPattern = function(patternType, callback) {
	var path = '';

	if (patternType === 'button') {
		path = './pattern/pattern_button.html';
	} else if (patternType === 'default') {
		path = './pattern/pattern.html';
	}

	if (path === '') return null;

	var filename = require.resolve(path);

	fs.readFile(filename, 'utf8', function(err, html) {
		return callback(html);
	});
};
