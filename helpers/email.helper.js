const nodemailer = require('nodemailer');
async function send(toEmail, emailSubject, emailContent, yourCustomHTML, attach) {
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: Number(process.env.EMAIL_PORT),
		secure: false,
		auth: {
			user: process.env.EMAIl_USERNAME,
			pass: process.env.EMAIL_PASSWORD
		}
	});

	if (attach.length > 0 && typeof attach !== 'undefined')
		return transporter.sendMail({
			from: process.env.EMAIL_FROM,
			to: toEmail,
			subject: emailSubject,
			text: emailContent,
			attachments: attach,
			html: yourCustomHTML
		});
	else {
		return transporter.sendMail({
			from: process.env.EMAIL_FROM,
			to: toEmail,
			subject: emailSubject,
			text: emailContent,
			html: yourCustomHTML
		});
	}
}

module.exports = { send };
