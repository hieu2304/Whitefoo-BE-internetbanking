//các lỗi xảy ra liên quan tài khoản ngân hàng hoặc các sự kiên có liên quan
module.exports.accountErrorsConstant = {
	ACCOUNTID_EMPTY: {
		code: 'ACCOUNTID_EMPTY',
		message: 'accountId must not empty'
	},

	REQUESTACCOUNTID_EMPTY: {
		code: 'REQUESTACCOUNTID_EMPTY',
		message: 'requestAccountId must not empty'
	},

	MONEY_EMPTY: {
		code: 'MONEY_EMPTY',
		message: 'money must not empty'
	},

	SELF_DETECT: {
		code: 'SELF_DETECT',
		message: 'You can not transfer to your sending account'
	},

	NOT_BELONG: {
		code: 'NOT_BELONG',
		message: 'This account not belong to the current user'
	},

	NOT_EXISTS: {
		code: 'NOT_EXISTS',
		message: 'Destination account not exists'
	},

	SELF_NOT_EXISTS: {
		code: 'SELF_NOT_EXISTS',
		message: 'Your account not exists or does not a payment account'
	},

	SELF_LOCKED: {
		code: 'SELF_LOCKED',
		message: 'Your account being locked'
	},

	LOCKED: {
		code: 'DESTINATION_LOCKED',
		message: 'Destination account being locked'
	},

	NOT_ENOUGH: {
		code: 'NOT_ENOUGH',
		message: 'The total of transfer value and fee is larger than your balance'
	},

	REQUIRE_MINIMUM: {
		code: 'REQUIRE_MINIMUM',
		message: 'Your transfer value not reached the minimum threshold, minimum is 20000 VND'
	},

	LIMIT_TRANSFER: {
		code: 'LIMIT_TRANSFER',
		message: 'You reached the maximum threshold of the transfer, maximum is 200mil VND'
	},

	LIMIT_DAY: {
		code: 'LIMIT_DAY',
		message: 'You reached the maximum threshold of the day, maximum is 500mil VND'
	},

	LIMIT_MONTH: {
		code: 'LIMIT_MONTH',
		message: 'You reached the maximum threshold of the month, maximum is 10bil VND'
	},

	REFUND: {
		code: 'REFUND',
		message: 'Something happened, we have refunded'
	}
};

//các lỗi xảy ra ở bảng user hoặc có liên quan người dùng
module.exports.userErrorsConstant = {
	WRONG_PASSWORD: { code: 'WRONG_PASSWORD', message: 'current Password is wrong' },

	EMAIL_CONFLICT: { code: 'EMAIL_CONFLICT', message: 'Email already used by other people' },

	EMAIL_TOO_SHORT: { code: 'EMAIL_TOO_SHORT', message: 'Email to short, min is 5' },

	EMAIL_INVALID: { code: 'EMAIL_INVALID', message: 'Invalid email type' },

	USERNAME_CONFLICT: { code: 'USERNAME_CONFLICT', message: 'Username already used by other people' },
	USERNAME_TOO_SHORT: { code: 'USERNAME_TOO_SHORT', message: 'username to short, min is 3' },

	USERNAME_TOO_LONG: { code: 'USERNAME_TOO_LONG', message: 'username to long, max is 20' },

	USERNAME_INVALID: {
		code: 'USERNAME_INVALID',
		message: 'username only can be alphabetic none UTF-8 and number, start with alphabetic none-UTF8'
	},

	PASSWORD_TOO_SHORT: { code: 'PASSWORD_TOO_SHORT', message: 'password to short, min is 8' },

	PASSWORD_TOO_LONG: { code: 'PASSWORD_TOO_LONG', message: 'password to long, max is 40' },

	PASSWORD_INVALID: { code: 'PASSWORD_INVALID', message: 'password must start with alphabetic' },

	PASSWORD_NOT_EQUAL: { code: 'PASSWORD_NOT_EQUAL', message: 'password not equals to confirmPassword' },

	LASTNAME_TOO_SHORT: { code: 'LASTNAME_TOO_SHORT', message: 'lastName to short, min is 3' },

	LASTNAME_TOO_LONG: { code: 'LASTNAME_TOO_LONG', message: 'lastName to long, max is 20' },

	LASTNAME_INVALID: {
		code: 'LASTNAME_INVALID',
		message: 'lastName only can be alphabetic utf8, number and dot, must start with alphabetic uft8'
	},

	FIRSTNAME_TOO_SHORT: { code: 'FIRSTNAME_TOO_SHORT', message: 'firstName to short, min is 3' },

	FIRSTNAME_TOO_LONG: { code: 'FIRSTNAME_TOO_LONG', message: 'firstName to long, max is 20' },

	FIRSTNAME_INVALID: {
		code: 'FIRSTNAME_INVALID',
		message: 'firstName only can be alphabetic utf8, number and dot, must start with alphabetic utf8'
	},

	ADDRESS_TOO_SHORT: { code: 'ADDRESS_TOO_SHORT', message: 'address to short, min is 6' },

	ADDRESS_TOO_LONG: { code: 'ADDRESS_TOO_LONG', message: 'address to long, max is 60' },

	PHONENUMBER_CONFLICT: { code: 'PHONENUMBER_CONFLICT', message: 'phoneNumber already used by other people' },

	PHONENUMBER_TOO_SHORT: { code: 'PHONENUMBER_TOO_SHORT', message: 'phoneNumber to short, min is 3' },

	PHONENUMBER_TOO_LONG: { code: 'PHONENUMBER_TOO_LONG', message: 'phoneNumber to long, max is 20' },

	PHONENUMBER_INVALID: {
		code: 'PHONENUMBER_INVALID',
		message: 'phoneNumber only can be number or number with 1 plus at start'
	},

	CITIZENIDENTIFICATIONID_CONFLICT: {
		code: 'CITIZENIDENTIFICATIONID_CONFLICT',
		message: 'citizenIdentificationId already used by other people'
	},
	CITIZENIDENTIFICATIONID_TOO_SHORT: {
		code: 'CITIZENIDENTIFICATIONID_TOO_SHORT',
		message: 'citizenIdentificationId to short, min is 5'
	},

	DATEOFBIRTH_INVALID: {
		code: 'DATEOFBIRTH_INVALID',
		message: 'Invalid dateOfBirth, can only DD/MM/YYYY'
	},

	ACTIVECODE_INVALID: {
		code: 'ACTIVECODE_INVALID',
		message: 'Invalid activeCode'
	},

	FORGOTCODE_INVALID: {
		code: 'FORGOTCODE_INVALID',
		message: 'Invalid forgotCode'
	},

	VERIFYCODE_INVALID: {
		code: 'VERIFYCODE_INVALID',
		message: 'Invalid or wrong verifyCode'
	},

	USER_NOT_FOUND: {
		code: 'USER_NOT_FOUND',
		message: 'User not exists'
	},

	USER_NOT_UPLOAD_ID: {
		code: 'USER_NOT_UPLOAD_ID',
		message: 'User not upload image(s) of id card yet!'
	},

	LOGIN_INVALID: {
		code: 'LOGIN_INVALID',
		message: 'Wrong login name or password'
	},

	EMAIL_VERIFIED: {
		code: 'EMAIL_VERIFIED',
		message: 'User already verified email'
	},

	ACTIVE_SENT: {
		code: 'ACTIVE_SENT',
		message: 'Email has been sent to your inbox, please wait 5 minutes to use resend again'
	},

	ISSUEDATE_INVALID: {
		code: 'ISSUEDATE_INVALID',
		message: 'Invalid issueDate, can only DD/MM/YYYY'
	},

	IDENTIFICATIONTYPE_INVALID: {
		code: 'IDENTIFICATIONTYPE_INVALID',
		message: 'Invalid identificationType, can only be CMND or CCCD'
	},

	ENABLE2FA_INVALID: {
		code: 'ENABLE2FA_INVALID',
		message: 'Invalid enable2fa, can only be 0 or 1'
	}
};
