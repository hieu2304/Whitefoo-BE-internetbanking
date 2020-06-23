const signature = 'whitefooBank © 2020';
const signatureHTML = '<br><h3><i>Trân trọng,' + signature + '</i></h3>';

module.exports.verifyEmailMessage = function(email, lastName, firstName, newVerifyCode) {
	const _html =
		'<h2>Xin chào người dùng ' +
		((firstName + lastName) | email) +
		' <h2> <br> <h3><b>Mã kích hoạt tài khoản của bạn là</b> </h3> <br> <br> <h1><b>' +
		newVerifyCode +
		'</b></h1>' +
		signatureHTML;
	return _html;
};

module.exports.resendVerifyEmailMessage = function(email, lastName, firstName, newVerifyCode) {
	const _html =
		'<h2>Xin chào người dùng ' +
		((firstName + lastName) | email) +
		' <h2> <br> <h3><b>Mã kích hoạt mới của bạn là</b> </h3> <br> <br> <h1><b>' +
		newVerifyCode +
		'</b></h1>' +
		signatureHTML;
	return _html;
};

module.exports.loadUpSuccessMessage = function(email, lastName, firstName, value, valueLeft) {
	const _html =
		'<h2>Xin chào người dùng ' +
		((firstName + lastName) | email) +
		' <h2> <br> <h3><b>Bạn vừa nạp thành công ' +
		value +
		'vào tài khoản của mình</b> Số dư hiện tại: ' +
		valueLeft +
		' </h3>' +
		signatureHTML;
	return _html;
};

module.exports.tradeSuccessMessage = function(email, lastName, firstName, value, accountId2, valueLeft) {
	const _html =
		'<h2>Xin chào người dùng ' +
		((firstName + lastName) | email) +
		' <h2> <br> <h3><b>Bạn chuyển khoản thành công ' +
		value +
		'vào tài khoản có STK' +
		accountId2 +
		' </b> Số dư còn lại: ' +
		valueLeft +
		' </h3>' +
		signatureHTML;
	return _html;
};
