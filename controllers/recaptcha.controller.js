const request = require('request');

/*

READ THE API FORM THE THIRD SERVER:
https://medium.com/@samuelhenshaw2020/recaptcha-v2-in-angular-8-with-back-end-verification-with-nodejs-9574f297fdef#9534

SPECIAL THANKS TO GOOGLE

*/

module.exports.reCaptchaV2_ReceivingAndValidating = function(req, res) {
	const token = req.body.recaptcha;

	//the secret key from your google admin console;
	const reCaptchaKey = process.env.CAPTCHA_KEY; //'SECRET_KEY' provided from Google reCAPTCHA;

	const url = `https://www.google.com/recaptcha/api/siteverify?secret=${reCaptchaKey}&response=${token}&remoteip=${req
		.connection.remoteAddress}`;

	if (token === null || token === undefined) {
		return res.status(403).send({ success: false, message: 'Invalid Token reCaptcha' });
	}

	var result = { success: true, message: 'OK' };

	//gọi api bên server thứ 3, chờ kết quả gửi về server chúng ta rồi mới response cho client chúng ta
	request(url, function(err, response, body) {
		body = JSON.parse(body);

		if (typeof body.success !== 'undefined' && !body.success) {
			result.success = false;
			result.message = 'failed';

			return res.status(409).send(result);
		}

		return res.status(200).send(result);
	});

	/*			CHÚ 	Ý

	không response bất kỳ thứ gì dưới đây vì chúng ta sẽ chờ server bên thứ 3 chúng ta đã request (google), response cho server chúng ta, server chúng ta chờ và nhận từ bên thứ 3 sau đó response cho client, nếu response dưới đây sẽ bị lỗi response quá nhiều cho client (do res dưới đây sẽ chạy trước, sau đó server bên thứ 3 response cho server chúng ta, chúng ta lại chạy respone cho client chúng ta thêm lần nữa.) -> lỗi [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client

	*/
};
