const nodemailer = require('nodemailer');
async function send(toEmail, emailSubject, emailContent, yourCustomHTML) {
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
		to: toEmail,
		subject: emailSubject,
		text: emailContent,
		html: yourCustomHTML
	});
}

module.exports = { send };
