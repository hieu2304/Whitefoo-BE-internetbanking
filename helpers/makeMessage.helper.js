const registerThankMessage =
	'Cảm ơn bạn đã tin tưởng và đăng ký whitefooBank của chúng tôi, chúng tôi hy vọng sẽ mang lại cho bạn trải nghiệm tốt nhất!';
const thankMessage = 'Cảm ơn bạn đã tin tưởng và sử dụng whitefooBank của chúng tôi!';
const signature = 'whitefooBank © 2020';
const signatureHTML = '<br><p>Trân trọng, ' + signature + '</p>';

module.exports.verifyEmailMessage = function(email, lastName, firstName, activeCode) {
	//${HOST_URL}/activate?token=qwerty
	const linkDirect = process.env.HOST_URL + '/activate?token=' + activeCode;
	const content = 'link kích hoạt tài khoản: ' + linkDirect;
	const html =
		'<body>' +
		'<h2>Xin chào ' +
		lastName +
		' ' +
		firstName +
		',<br><br>Đường dẫn kích hoạt tài khoản của bạn là:<br><b>' +
		'<a href="' +
		linkDirect +
		'">Bấm vào đây</a>' +
		'</b></h2><br><h3>' +
		registerThankMessage +
		signatureHTML +
		'</h3></body>';

	return { content, html };
};

module.exports.resendVerifyEmailMessage = function(email, lastName, firstName, activeCode) {
	const linkDirect = process.env.HOST_URL + '/activate?token=' + activeCode;
	const content = 'link kích hoạt tài khoản: ' + linkDirect;
	const html =
		'<body>' +
		'<h2>Xin chào ' +
		lastName +
		' ' +
		firstName +
		',<br><br>Đường dẫn kích hoạt lại tài khoản của bạn là:<br><b>' +
		'<a href="' +
		linkDirect +
		'">Bấm vào đây</a>' +
		'</b></h2><br><h3>' +
		registerThankMessage +
		signatureHTML +
		'</h3></body>';

	return { content, html };
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

//tin này gửi cho bên gửi (bên A)
module.exports.transferSuccessMessage = function(
	email,
	lastName,
	firstName,
	value,
	fee,
	accountId,
	accountId2,
	valueLeft,
	currency,
	message
) {
	const content =
		'Bạn vừa chuyển tiền thành công từ STK' +
		accountId +
		'tiền gửi :' +
		value +
		currency +
		' cho STK: ' +
		accountId2 +
		', phí đã trả là: ' +
		fee +
		', số dư còn lại: ' +
		valueLeft;

	const html =
		'<body>' +
		'<h2>Xin chào ' +
		lastName +
		' ' +
		firstName +
		',<br><br>Bạn vừa chuyển tiền thành công, thông tin chi tiết:</h2>' +
		'<br>STK gửi: ' +
		accountId +
		'<br>STK nhận: ' +
		accountId2 +
		'<br>Tiền đã gửi: ' +
		value +
		currency +
		'<br>Phí đã trả: ' +
		fee +
		currency +
		'<br>Số dư còn lại: ' +
		valueLeft +
		currency +
		'<br>Tin nhắn kèm theo: ' +
		message +
		'<h3><br>' +
		thankMessage +
		signatureHTML +
		'</h3></body>';

	return { content, html };
};

//tin này gửi cho bên nhận (bên B)
module.exports.transferSuccessMessageDes = function(
	email,
	lastName,
	firstName,
	value,
	accountId,
	accountId2,
	valueLeft,
	currency,
	message
) {
	const content =
		'Bạn vừa nhận tiền thành công từ STK' +
		accountId +
		'tiền nhận :' +
		value +
		currency +
		' cho STK: ' +
		accountId2 +
		', số dư còn lại: ' +
		valueLeft;

	const html =
		'<body>' +
		'<h2>Xin chào ' +
		lastName +
		' ' +
		firstName +
		',<br><br>Bạn vừa nhận tiền thành công, thông tin chi tiết:</h2>' +
		'<br>STK gửi: ' +
		accountId +
		'<br>STK nhận: ' +
		accountId2 +
		'<br>Tiền đã nhận: ' +
		value +
		currency +
		'<br>Số dư còn lại: ' +
		valueLeft +
		currency +
		'<br>Tin nhắn kèm theo: ' +
		message +
		'<h3><br>' +
		thankMessage +
		signatureHTML +
		'</h3></body>';

	return { content, html };
};

module.exports.forgotPasswordMessage = function(email, lastName, firstName, forgotCode) {
	//${HOST_URL}/forgotpassword?token=fapfapfap
	const linkDirect = process.env.HOST_URL + '/forgotpassword?token=' + forgotCode;
	const content = 'link lấy lại mật khẩu của bạn: ' + linkDirect;
	const html =
		'<body>' +
		'<h2>Xin chào ' +
		lastName +
		' ' +
		firstName +
		',<br><br>Đường dẫn lấy lại mật khẩu của bạn là:<br><b>' +
		'<a href="' +
		linkDirect +
		'">Bấm vào đây</a>' +
		'</b></h2><br><h3>' +
		thankMessage +
		signatureHTML +
		'</h3></body>';

	return { content, html };
};

module.exports.transferVerifyMessage = function(email, lastName, firstName, verifyCode) {
	const content = 'Mã xác minh 2 bước chuyển khoản của bạn là: ' + verifyCode;
	const html =
		'<body>' +
		'<h2>Xin chào ' +
		lastName +
		' ' +
		firstName +
		',<br><br>Mã xác minh 2 bước chuyển khoản của bạn là:</h2><br><b><h1>' +
		verifyCode +
		'</h1></b><br><h3>' +
		thankMessage +
		signatureHTML +
		'</h3></body>';

	return { content, html };
};
