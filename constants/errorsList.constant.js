module.exports.BaseJWTErrorsList = {
	401: 'Invalid Token',
	conflict: 'conflict error: input values is conflict with existed values'
};

module.exports.defaultPhoneNumberList = {
	0: '113',
	1: '114',
	2: '911'
};

module.exports.registerErrorValidate = {
	EMAIL_TOO_SHORT: { code: 'EMAIL_TOO_SHORT', message: 'Email to short, min is 5' },
	EMAIL_INVALID: { code: 'EMAIL_INVALID', message: 'Invalid email type' },

	USERNAME_TOO_SHORT: { code: 'USERNAME_TOO_SHORT', message: 'userName to short, min is 3' },
	USERNAME_TOO_LONG: { code: 'USERNAME_TOO_LONG', message: 'userName to long, max is 20' },
	USERNAME_INVALID: {
		code: 'USERNAME_INVALID',
		message: 'userName only can be alphabetic and number, start with alphabetic'
	},

	PASSWORD_TOO_SHORT: { code: 'PASSWORD_TOO_SHORT', message: 'password to short, min is 8' },
	PASSWORD_TOO_LONG: { code: 'PASSWORD_TOO_LONG', message: 'password to long, max is 40' },
	PASSWORD_INVALID: { code: 'PASSWORD_INVALID', message: 'password must start with alphabetic' },
	PASSWORD_NOT_EQUAL: { code: 'PASSWORD_NOT_EQUAL', message: 'password not equals to confirmPassword' },

	LASTNAME_TOO_SHORT: { code: 'LASTNAME_TOO_SHORT', message: 'lastName to short, min is 3' },
	LASTNAME_TOO_LONG: { code: 'LASTNAME_TOO_LONG', message: 'lastName to long, max is 20' },
	LASTNAME_INVALID: { code: 'LASTNAME_INVALID', message: 'lastName only can be alphabetic utf8, number and dot' },

	FIRSTNAME_TOO_SHORT: { code: 'FIRSTNAME_TOO_SHORT', message: 'firstName to short, min is 3' },
	FIRSTNAME_TOO_LONG: { code: 'FIRSTNAME_TOO_LONG', message: 'firstName to long, max is 20' },
	FIRSTNAME_INVALID: { code: 'FIRSTNAME_INVALID', message: 'firstName only can be alphabetic utf8, number and dot' },

	ADDRESS_TOO_SHORT: { code: 'ADDRESS_TOO_SHORT', message: 'address to short, min is 6' },
	ADDRESS_TOO_LONG: { code: 'ADDRESS_TOO_LONG', message: 'address to long, max is 60' },

	PHONENUMBER_TOO_SHORT: { code: 'PHONENUMBER_TOO_SHORT', message: 'phoneNumber to short, min is 3' },
	PHONENUMBER_TOO_LONG: { code: 'PHONENUMBER_TOO_LONG', message: 'phoneNumber to long, max is 20' },
	PHONENUMBER_INVALID: {
		code: 'PHONENUMBER_INVALID',
		message: 'phoneNumber only can be number or number with 1 plus at start'
	},

	DATEOFBIRTH_INVALID: {
		code: 'DATEOFBIRTH_INVALID',
		message: 'invalid dateOfBirth, can only DD/MM/YYY or YYYY/MM/DD or MM/DD/YYYY'
	}
};
