const getHTMLService = require('../constants/getHTML.constant');
const getAttachments = require('../constants/attachments.constant');
const moment = require('moment');

const registerThankMessage =
	'Cảm ơn bạn đã tin tưởng và đăng ký whitefooBank của chúng tôi, chúng tôi hy vọng sẽ mang lại cho bạn trải nghiệm tốt nhất!';
const thankMessage = 'Cảm ơn bạn đã tin tưởng và sử dụng WhiteFoo Bank của chúng tôi!';
const signature = 'whitefooBank © 2020';
const signatureHTML = '<br><p>Trân trọng, ' + signature + '</p>';

//hàm được gọi để thay thế các URL cố định
function replaceConstantURL(html) {
	//replace all
	html = html.split('{Re_Home_URL}').join(process.env.HOST_URL + '/');
	html = html.split('{Re_About_URL}').join(process.env.HOST_URL + '/about');
	html = html.split('{Re_FAQs_URL}').join(process.env.HOST_URL + '/faq');
	html = html.split('{Re_Contact_URL}').join(process.env.HOST_URL + '/contact');

	return html;
}

//tin nhắn kích hoạt email
module.exports.verifyEmailMessage = function(email, lastName, firstName, activeCode, callback) {
	//${HOST_URL}/activate?token=qwerty

	const linkDirect = process.env.HOST_URL + '/activate?token=' + activeCode;

	const content = 'link kích hoạt tài khoản: ' + linkDirect;

	getHTMLService.getHTMLPattern(1, function(response) {
		var html = response;
		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Kích hoạt tài khoản');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn đã đăng ký tài khoản thành công, để hoàn tất quá trình đăng ký và có thể sử dụng dây đủ các tính năng, hãy bấm nút bên dưới để kích hoạt tài khoản!'
		);

		html = html.replace('{Re_Content_2}', '');
		html = html.replace('{Re_Thanks_Message}', registerThankMessage);
		html = html.replace('{Re_Button}', 'Kích hoạt');
		html = html.replace('{Re_Button_URl}', linkDirect);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};
//test
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

//tin nhắn dc gửi khi nạp tiền thành công
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

		html = html.replace('{Re_Image}', 'main');
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
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin này gửi cho bên gửi (bên A)
module.exports.transferSuccessMessage = function(
	lastName,
	firstName,
	value,
	fee,
	accountIdSend,
	accountIdReceive,
	valueLeft,
	currencySend,
	message,
	callback
) {
	var currencySend = ' ' + currencySend;
	const content =
		'Bạn vừa chuyển tiền thành công từ STK' +
		accountIdSend +
		'\ntiền gửi :' +
		value +
		currencySend +
		'\ncho STK: ' +
		accountIdReceive +
		'\nPhí đã trả: ' +
		fee +
		currencySend +
		'\nSố dư còn lại: ' +
		valueLeft +
		currencySend +
		'\nTin nhắn: ' +
		message;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Chuyển tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa thực hiện chuyển tiền thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'<br>STK gửi: ' +
				accountIdSend +
				'<br>STK nhận: ' +
				accountIdReceive +
				'<br>Tiền đã gửi: ' +
				value +
				currencySend +
				'<br>Phí đã trả: ' +
				fee +
				currencySend +
				'<br>Số dư hiện tại: ' +
				valueLeft +
				currencySend +
				'<br>Tin đã gửi kèm: ' +
				message +
				'<br>'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin này gửi cho bên nhận (bên B)
module.exports.transferSuccessMessageDes = function(
	lastName,
	firstName,
	value,
	accountIdSend,
	accountIdReceive,
	valueLeft,
	currencySend,
	currencyReceive,
	message,
	callback
) {
	var currencySend = ' ' + currencySend;
	var currencyReceive = ' ' + currencyReceive;
	const content =
		'Bạn vừa nhận tiền thành công từ STK' +
		accountIdSend +
		'\nTiền nhận :' +
		value +
		currencySend +
		'\nSTK nhận: ' +
		accountIdReceive +
		'\nSố dư còn lại: ' +
		valueLeft +
		currencyReceive +
		'\nTin nhắn: ' +
		message;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Nhận tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa nhận tiền thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'<br>STK gửi: ' +
				accountIdSend +
				'<br>STK nhận: ' +
				accountIdReceive +
				'<br>Tiền đã nhận: ' +
				value +
				currencySend +
				'<br>Số dư hiện tại: ' +
				valueLeft +
				currencyReceive +
				'<br>Tin nhắn kèm theo: ' +
				message +
				'<br>'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn quên mật khẩu
module.exports.forgotPasswordMessage = function(email, lastName, firstName, forgotCode, callback) {
	//${HOST_URL}/passwordrecovery?token=fapfapfap

	const linkDirect = process.env.HOST_URL + '/passwordrecovery?token=' + forgotCode;

	const content = 'link lấy lại mật khẩu của bạn: ' + linkDirect;

	getHTMLService.getHTMLPattern(1, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
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

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn gửi cho các hoạt động cần xác minh 2 bước
module.exports.transferVerifyMessage = function(email, lastName, firstName, verifyCode, callback) {
	const content = 'Mã xác minh 2 bước của bạn là: ' + verifyCode;
	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Xác minh 2 bước');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa yêu cầu lấy mã xác minh 2 bước, mã của bạn là:'
		);

		html = html.replace('{Re_Content_2}', '');
		html = html.replace('{Re_Code}', verifyCode);
		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn gửi khi rút tiền tài khoản tiết kiệm
module.exports.withdrawMessageAccumulated = function(
	email, //email client
	lastName, //tên của client
	firstName, //họ của client
	value, //tiền vốn
	profit, //tiền lời
	accountId, //STK rút
	dayPassed, //số ngày đã gửi
	term, //kỳ hạn mà client đăng ký
	startTermDate, //ngày bắt đầu tính (gửi)
	valueLeft, //vốn sau khi rút
	currencyIn, //đơn vị tiền tệ của tài khoản
	message, //tin nhắn kèm theo
	callback
) {
	const currency = ' ' + currencyIn;
	const content =
		'Bạn vừa rút tiền thành công:\nSTK' +
		accountId +
		'\nTiền vốn đã rút:' +
		value +
		currency +
		'\nTiền lời đã rút:' +
		profit +
		currency +
		'\nSố dư sau khi rút: ' +
		valueLeft +
		currency +
		'Kỳ hạn đăng ký: ' +
		term +
		' tháng' +
		'\nNgày gửi: ' +
		startTermDate +
		'\nNgày rút: ' +
		moment().format('DD/MM/YYYY') +
		'\nSố ngày đã gửi: ' +
		dayPassed +
		'\nTin nhắn: ' +
		message;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Rút tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa rút tiền từ tài khoản tiết kiệm thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'<br>STK chọn rút: ' +
				accountId +
				'<br>Tiền vốn đã rút: ' +
				value +
				currency +
				'<br>Tiền lời đã rút: ' +
				profit +
				currency +
				'<br>Số dư sau khi rút: ' +
				valueLeft +
				currency +
				'<br>Kỳ hạn đăng ký: ' +
				term +
				' tháng' +
				'<br>Ngày gửi: ' +
				startTermDate +
				'<br>Ngày rút: ' +
				moment().format('DD/MM/YYYY') +
				'<br>Số ngày đã gửi: ' +
				dayPassed +
				' ngày' +
				'<br>Tin nhắn: ' +
				message
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn rút tiền tài khoản thanh toán
module.exports.withdrawMessagePayment = function(
	lastName,
	firstName,
	accountId,
	value,
	currencyIn,
	valueLeft,
	message,
	callback
) {
	const currency = ' ' + currencyIn;
	const content =
		'Bạn đã rút tiền từ STK: ' + accountId + '\nĐã rút: ' + value + currency + '\nCòn lại: ' + valueLeft + currency;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Rút tiền thành công');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa thực hiện rút tiền từ tài khoản thanh toán thành công, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'STK: ' +
				accountId +
				'<br>Số tiền đã rút: ' +
				value +
				currency +
				'<br>Số dư còn lại: ' +
				valueLeft +
				currency +
				'<br>Tin nhắn: ' +
				message
		);
		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);
		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn cho email cũ khi đổi email
module.exports.changeEmailMessageOldEmail = function(lastName, firstName, oldEmail, newEmail, callback) {
	const content = 'đã thay đổi email:\n - Từ: ' + oldEmail + '\n - Sang: ' + newEmail;

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Thay đổi Email');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa thực hiện đổi email mới, chi tiết:'
		);

		html = html.replace('{Re_Content_2}', 'Email cũ: ' + oldEmail + '<br>' + 'Email mới: ' + newEmail);
		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn cho email mới khi đổi email
module.exports.changeEmailMessageNewEmail = function(email, lastName, firstName, activeCode, callback) {
	//${HOST_URL}/activate?token=qwerty

	const linkDirect = process.env.HOST_URL + '/activate?token=' + activeCode;

	const content = 'link kích hoạt Email: ' + linkDirect;

	getHTMLService.getHTMLPattern(1, function(response) {
		var html = response;
		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Kích hoạt Email');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa đăng ký Email mới thành công, hãy bấm nút bên dưới để kích hoạt Email!'
		);

		html = html.replace('{Re_Content_2}', '');
		html = html.replace('{Re_Thanks_Message}', registerThankMessage);
		html = html.replace('{Re_Button}', 'Kích hoạt');
		html = html.replace('{Re_Button_URl}', linkDirect);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);

		//replace all constant URL
		html = replaceConstantURL(html);
		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn khi được duyệt CMNND
module.exports.approvedCitizenIdMessage = function(lastName, firstName, citizenIdentificationId, callback) {
	const content = 'Bạn đã được duyệt CMND/CCCD';
	const idLength = citizenIdentificationId.length;
	var citizenIdentificationIdCensored = citizenIdentificationId;
	if (idLength > 3) {
		citizenIdentificationIdCensored = citizenIdentificationIdCensored.substring(0, idLength - 3);
		citizenIdentificationIdCensored += '***';
	}

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Đã duyệt CMND/CCCD');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, bạn vừa được phê duyệt CMND/CCCD, chi tiết:'
		);

		html = html.replace('{Re_Content_2}', 'CMND/CCCD được duyệt: ' + citizenIdentificationIdCensored);
		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn khi bị chỉnh sửa STK
module.exports.editAccountMessage = function(
	lastName,
	firstName,
	accountId,
	lastName_staff,
	firstName_staff,
	email_staff,
	callback
) {
	const content =
		'Chỉnh sửa số tài khoản ' +
		accountId +
		', bởi nhân viên ' +
		firstName_staff +
		' ' +
		lastName_staff +
		'(Email: ' +
		email_staff +
		').';

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Chỉnh sửa số tài khoản');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, Số tài khoản thuộc sở hữu của bạn đã được chỉnh sửa thông tin bởi nhân viên, chi tiết:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'Số tài khoản: ' +
				accountId +
				'<br>' +
				'Họ và tên nhân viên thực hiện: ' +
				firstName_staff +
				' ' +
				lastName_staff +
				'<br>' +
				'Email nhân viên: ' +
				email_staff +
				'<br>Nếu số tài khoản của bạn bị chỉnh sửa ngoài ý muốn, hãy liên hệ ngay với nhân viên của ngân hàng WhiteFoo!'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};

//tin nhắn khi bị chỉnh sửa thông tin cá nhân
module.exports.editUserMessage = function(lastName, firstName, lastName_staff, firstName_staff, email_staff, callback) {
	const content =
		'Thay đổi thông tin cá nhân' +
		', bởi nhân viên ' +
		firstName_staff +
		' ' +
		lastName_staff +
		'(Email: ' +
		email_staff +
		').';

	getHTMLService.getHTMLPattern(0, function(response) {
		var html = response;

		html = html.replace('{Re_Image}', 'main');
		html = html.replace('{Re_Title}', 'Thay đổi thông tin cá nhân');

		html = html.replace(
			'{Re_Content_1}',
			'Xin chào {Re_FirstName} {Re_LastName}, thông tin cá nhân của bạn đã được thay đổi bởi nhân viên:'
		);

		html = html.replace(
			'{Re_Content_2}',
			'Họ và tên nhân viên thực hiện: ' +
				firstName_staff +
				' ' +
				lastName_staff +
				'<br>' +
				'Email nhân viên: ' +
				email_staff +
				'<br>Nếu thông tin cá nhân của bạn bị chỉnh sửa ngoài ý muốn, hãy liên hệ ngay với nhân viên của ngân hàng WhiteFoo!'
		);

		html = html.replace('{Re_Thanks_Message}', thankMessage);
		html = html.replace('{Re_LastName}', lastName);
		html = html.replace('{Re_FirstName}', firstName);
		html = html.replace('{Re_Code}', '');

		//replace all constant URL
		html = replaceConstantURL(html);

		const attachments = getAttachments.mainImageAttachments;

		return callback({ content, html, attachments });
	});
};
