const nodemailer = require('nodemailer');
const user_email = process.env.EMAIl_USERNAME;
const user_passwords = process.env.EMAIL_PASSWORD;
async function send(_to, _subject, _content, _html) {
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: user_email,
			pass: user_passwords
		}
	});

	//const info = await
	return transporter.sendMail({
		from: user_email,
		to: _to,
		subject: _subject,
		text: _content,
		html: _html
	});
}

module.exports = { send };
