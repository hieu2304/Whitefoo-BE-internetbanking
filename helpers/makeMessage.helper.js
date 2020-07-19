const getHTMLService = require('../constants/getHTML.constant');
const getAttachments = require('../constants/attachments.constant');
var fs = require('fs');

const registerThankMessage =
	'Cảm ơn bạn đã tin tưởng và đăng ký whitefooBank của chúng tôi, chúng tôi hy vọng sẽ mang lại cho bạn trải nghiệm tốt nhất!';
const thankMessage = 'Cảm ơn bạn đã tin tưởng và sử dụng WhiteFoo Bank của chúng tôi!';
const signature = 'whitefooBank © 2020';
const signatureHTML = '<br><p>Trân trọng, ' + signature + '</p>';

module.exports.verifyEmailMessage = function(email, lastName, firstName, activeCode, callback) {
	//${HOST_URL}/activate?token=qwerty

	const linkDirect = process.env.HOST_URL + '/activate?token=' + activeCode;

	const content = 'link kích hoạt tài khoản: ' + linkDirect;

	getHTMLService.getHTMLPattern(1, function(response) {
		var html = response;
		html = html.replace('{Re_Image}', 'email');
		html = html.replace('{Re_Title}', 'Kích hoạt tài khoản');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa đăng ký tài khoản thành công, hãy bấm nút bên dưới để kích hoạt tài khoản!'
		);

		html = html.replace('{Re_Content_2}', '');
		html = html.replace('{Re_Thanks_Message}', registerThankMessage);
		html = html.replace('{Re_Button}', 'Kích hoạt');
		html = html.replace('{Re_Button_URl}', linkDirect);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all
		html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
		html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');

		const attachments = getAttachments.emailAttachments;

		return callback({ content, html, attachments });
	});
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

module.exports.loadUpSuccessMessage = function(
	email,
	accountId,
	lastName,
	firstName,
	value,
	currencyIn,
	currencyIn2,
	valueLeft,
	callback
) {
	const currency = ' ' + currencyIn;
	const currency2 = ' ' + currencyIn2;
	const content =
		'Bạn vừa nạp tiền thành công cho STK ' +
		accountId +
		'\nTiền nhận :' +
		value +
		currency +
		'\nSố dư còn lại: ' +
		valueLeft;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'loadup');
		html = html.replace('{Re_Title}', 'Nạp tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa nạp tiền thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'<br>STK được nạp: ' +
				accountId +
				'<br>Tiền đã nạp: ' +
				value +
				currency +
				'<br>Số dư hiện tại: ' +
				valueLeft +
				currency2 +
				'<br>'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all
		html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
		html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');

		const attachments = getAttachments.loadUpAttachments;

		return callback({ content, html, attachments });
	});
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
	currencyIn,
	message,
	callback
) {
	const currency = ' ' + currencyIn;
	const content =
		'Bạn vừa chuyển tiền thành công từ STK' +
		accountId +
		'\ntiền gửi :' +
		value +
		currency +
		'\ncho STK: ' +
		accountId2 +
		'\nPhí đã trả: ' +
		fee +
		'\nSố dư còn lại: ' +
		valueLeft +
		'\nTin nhắn: ' +
		message;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'a');
		html = html.replace('{Re_Title}', 'Chuyển tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa thực hiện chuyển tiền thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
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
				'<br>Số dư hiện tại: ' +
				valueLeft +
				currency +
				'<br>Tin đã gửi kèm: ' +
				message +
				'<br>'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all
		html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
		html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');

		const attachments = getAttachments.sendAttachments;

		return callback({ content, html, attachments });
	});
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
	currencyIn,
	message,
	callback
) {
	const currency = ' ' + currencyIn;
	const content =
		'Bạn vừa nhận tiền thành công từ STK' +
		accountId +
		'\nTiền nhận :' +
		value +
		currency +
		'\nSTK nhận: ' +
		accountId2 +
		'\nSố dư còn lại: ' +
		valueLeft +
		'\nTin nhắn: ' +
		message;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'b');
		html = html.replace('{Re_Title}', 'Nhận tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa nhận tiền thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'<br>STK gửi: ' +
				accountId +
				'<br>STK nhận: ' +
				accountId2 +
				'<br>Tiền đã nhận: ' +
				value +
				currency +
				'<br>Số dư hiện tại: ' +
				valueLeft +
				currency +
				'<br>Tin nhắn kèm theo: ' +
				message +
				'<br>'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all
		html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
		html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');

		const attachments = getAttachments.receiveAttachments;

		return callback({ content, html, attachments });
	});
};

module.exports.forgotPasswordMessage = function(email, lastName, firstName, forgotCode, callback) {
	//${HOST_URL}/passwordrecovery?token=fapfapfap

	const linkDirect = process.env.HOST_URL + '/passwordrecovery?token=' + forgotCode;

	const content = 'link lấy lại mật khẩu của bạn: ' + linkDirect;

	getHTMLService.getHTMLPattern(1, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'verify');
		html = html.replace('{Re_Title}', 'Khôi phục mật khẩu');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa yêu cầu khôi phục mật khẩu, hãy bấm nút bên dưới để tiến hành quy trình khôi phục mật khẩu!'
		);

		html = html.replace('{Re_Content_2}', '');
		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_Button}', 'Khôi phục');
		html = html.replace('{Re_Button_URl}', linkDirect);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all
		html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
		html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');

		const attachments = getAttachments.verifyAttachments;

		return callback({ content, html, attachments });
	});
};

module.exports.transferVerifyMessage = function(email, lastName, firstName, verifyCode, callback) {
	const content = 'Mã xác minh 2 bước của bạn là: ' + verifyCode;
	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'verify');
		html = html.replace('{Re_Title}', 'Xác minh 2 bước');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa yêu cầu lấy mã xác minh 2 bước, mã của bạn là:'
		);

		html = html.replace('{Re_Content_2}', verifyCode);
		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all
		html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
		html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');

		const attachments = getAttachments.verifyAttachments;

		return callback({ content, html, attachments });
	});
};
