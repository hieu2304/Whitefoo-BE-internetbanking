const nodemailer = require('nodemailer');
async function send(_to, _subject, _content, _html) {
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: Number(process.env.EMAIL_PORT),
		secure: false,
		auth: {
			user: process.env.EMAIl_USERNAME,
			pass: process.env.EMAIL_PASSWORD
		}
	});

	//const info = await
	return transporter.sendMail({
		from: process.env.EMAIL_FROM,
		to: _to,
		subject: _subject,
		text: _content,
		html: _html
	});
}

module.exports = { send };
