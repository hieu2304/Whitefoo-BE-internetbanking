const { check, validationResult, body } = require('express-validator');
const moment = require('moment');
const regexConstant = require('../constants/regex.constants');
const asyncHandler = require('express-async-handler');
const errorListConstant = require('../constants/errorsList.constant');

module.exports.validateErrorHandle = function(req) {
	var isThereAnyErrors = validationResult(req);
	if (isThereAnyErrors.isEmpty()) return null;
	var errorList = isThereAnyErrors.array();
	var output = [];
	for (var i = 0; i < errorList.length; i++) {
		output[i] = errorList[i].msg;
	}
	return output;
};

function isNumber(n) {
	return !isNaN(parseFloat(n)) && !isNaN(n - 0);
}
module.exports.isNumber = isNumber;

//sử dụng middleware này cho router đăng ký
module.exports.validateRegisterInformation = function() {
	const errorConstant = errorListConstant.userErrorsConstant;
	var internalConfirmPassword = '';
	return [
		body('confirmPassword').custom(function(inputConfirmPassword) {
			internalConfirmPassword = inputConfirmPassword;
			return true;
		}),

		check('email', errorConstant.EMAIL_INVALID).isEmail(),
		check('email', errorConstant.EMAIL_TOO_SHORT).isLength({ min: 5 }),

		check('username', errorConstant.USERNAME_TOO_SHORT).isLength({ min: 3 }),
		check('username', errorConstant.USERNAME_TOO_LONG).isLength({ max: 20 }),
		check('username', errorConstant.USERNAME_INVALID).matches('^[A-za-z]+[A-Za-z0-9]+$'),

		check('password', errorConstant.PASSWORD_TOO_SHORT).isLength({ min: 8 }),
		check('password', errorConstant.PASSWORD_TOO_LONG).isLength({ max: 128 }),
		check('password', errorConstant.PASSWORD_INVALID).matches('^[A-za-z]'),
		check('password', errorConstant.PASSWORD_NOT_EQUAL).custom(function(password) {
			if (password === internalConfirmPassword) return true;
			return false;
		}),

		check('lastName', errorConstant.LASTNAME_TOO_SHORT).isLength({ min: 1 }),
		check('lastName', errorConstant.LASTNAME_TOO_LONG).isLength({ max: 20 }),
		check('lastName', errorConstant.LASTNAME_INVALID).matches(
			'^[' + regexConstant.vietnameseUnicode + ']+[0-9 ' + regexConstant.vietnameseUnicode + '.]+$'
		),

		check('firstName', errorConstant.FIRSTNAME_TOO_SHORT).isLength({ min: 1 }),
		check('firstName', errorConstant.FIRSTNAME_TOO_LONG).isLength({ max: 20 }),
		check('firstName', errorConstant.FIRSTNAME_INVALID).matches(
			'^[' + regexConstant.vietnameseUnicode + ']+[0-9 ' + regexConstant.vietnameseUnicode + '.]+$'
		),

		check('address', errorConstant.ADDRESS_TOO_SHORT).isLength({ min: 6 }),
		check('address', errorConstant.ADDRESS_TOO_LONG).isLength({ max: 100 }),

		check('phoneNumber', errorConstant.PHONENUMBER_TOO_SHORT).isLength({ min: 3 }),
		check('phoneNumber', errorConstant.PHONENUMBER_TOO_LONG).isLength({ max: 20 }),
		check('phoneNumber', errorConstant.PHONENUMBER_INVALID).custom(function(phoneNumber) {
			var firstNumber = String(phoneNumber).slice(0, 1);
			var lastNumber = String(phoneNumber).slice(1);
			//nếu ký tự đầu ko phải dấu + và cũng ko phải là số thì sai
			if (firstNumber != '+' && !isNumber(firstNumber)) return false;
			if (!isNumber(lastNumber)) return false;
			return true;
		}),

		check('dateOfBirth', errorConstant.DATEOFBIRTH_INVALID).custom(function(dateOfBirth) {
			const dateFormat = [ 'DD/MM/YYYY' ]; // , 'MM/DD/YYYY', 'YYYY/MM/DD'
			const result = moment(dateOfBirth, dateFormat).format('DD/MM/YYYY');
			if (result == 'Invalid date') return false;
			return true;

			//moment is now updated: https://momentjs.com/guides/#/warnings/js-date/
			//return moment(result, 'DD/MM/YYYY').isValid();

			//moment(scope.modelValue, 'DD-MMM-YYYY HH:mm a', true).isValid()
			//moment(checked_date, DATE_FORMAT).format(DATE_FORMAT) === checked_date
			//moment(checked_date, [DATE_FORMAT1, DATE_FORMAT2]).format(DATE_FORMAT) === checked_date
		})
	];
};

//sử dụng middleware này cho các router thay đổi Mật khẩu
module.exports.validateUpdateNewPassword = function() {
	var internalConfirmPassword = '';
	const errorConstant = errorListConstant.userErrorsConstant;
	return [
		body('confirmPassword').custom(function(inputConfirmPassword) {
			internalConfirmPassword = inputConfirmPassword;
			return true;
		}),
		check('newPassword', errorConstant.PASSWORD_TOO_SHORT).isLength({ min: 8 }),
		check('newPassword', errorConstant.PASSWORD_TOO_LONG).isLength({ max: 128 }),
		check('newPassword', errorConstant.PASSWORD_INVALID).matches('^[A-za-z]'),
		check('newPassword', errorConstant.PASSWORD_NOT_EQUAL).custom(function(password) {
			if (password === internalConfirmPassword) return true;
			return false;
		})
	];
};

//sử dụng middleware này cho router tự update cmnd chờ duyệt
module.exports.validateUpdateIdCard = function() {
	const errorConstant = errorListConstant.userErrorsConstant;
	return [
		check('citizenIdentificationId', errorConstant.CITIZENIDENTIFICATIONID_TOO_SHORT).isLength({ min: 5 }),
		check('issueDate', errorConstant.ISSUEDATE_INVALID).custom(function(issueDate) {
			const dateFormat = [ 'DD/MM/YYYY' ]; // , 'MM/DD/YYYY', 'YYYY/MM/DD'
			const result = moment(issueDate, dateFormat).format('DD/MM/YYYY');
			if (result == 'Invalid date') return false;
			return true;
		}),
		check('identificationType', errorConstant.IDENTIFICATIONTYPE_INVALID).custom(function(identificationType) {
			if (identificationType !== 'CMND' && identificationType !== 'CCCD') return false;
			return true;
		})
	];
};

//sử dụng middleware này cho router tự cập nhật thông tin cá nhân
module.exports.validateUpdateInfo = function() {
	const errorConstant = errorListConstant.userErrorsConstant;
	return [
		check('lastName', errorConstant.LASTNAME_TOO_SHORT).isLength({ min: 1 }),
		check('lastName', errorConstant.LASTNAME_TOO_LONG).isLength({ max: 20 }),
		check('lastName', errorConstant.LASTNAME_INVALID).matches(
			'^[' + regexConstant.vietnameseUnicode + ']+[0-9 ' + regexConstant.vietnameseUnicode + '.]+$'
		),

		check('firstName', errorConstant.FIRSTNAME_TOO_SHORT).isLength({ min: 1 }),
		check('firstName', errorConstant.FIRSTNAME_TOO_LONG).isLength({ max: 20 }),
		check('firstName', errorConstant.FIRSTNAME_INVALID).matches(
			'^[' + regexConstant.vietnameseUnicode + ']+[0-9 ' + regexConstant.vietnameseUnicode + '.]+$'
		),

		check('address', errorConstant.ADDRESS_TOO_SHORT).isLength({ min: 6 }),
		check('address', errorConstant.ADDRESS_TOO_LONG).isLength({ max: 100 }),

		check('dateOfBirth', errorConstant.DATEOFBIRTH_INVALID).custom(function(dateOfBirth) {
			const dateFormat = [ 'DD/MM/YYYY' ]; // , 'MM/DD/YYYY', 'YYYY/MM/DD'
			const result = moment(dateOfBirth, dateFormat).format('DD/MM/YYYY');
			if (result == 'Invalid date') return false;
			return true;
		}),

		check('phoneNumber', errorConstant.PHONENUMBER_TOO_SHORT).isLength({ min: 3 }),
		check('phoneNumber', errorConstant.PHONENUMBER_TOO_LONG).isLength({ max: 20 }),
		check('phoneNumber', errorConstant.PHONENUMBER_INVALID).custom(function(phoneNumber) {
			var firstNumber = String(phoneNumber).slice(0, 1);
			var lastNumber = String(phoneNumber).slice(1);
			//nếu ký tự đầu ko phải dấu + và cũng ko phải là số thì sai
			if (firstNumber != '+' && !isNumber(firstNumber)) return false;
			if (!isNumber(lastNumber)) return false;
			return true;
		}),

		check('username', errorConstant.USERNAME_TOO_SHORT).isLength({ min: 3 }),
		check('username', errorConstant.USERNAME_TOO_LONG).isLength({ max: 20 }),
		check('username', errorConstant.USERNAME_INVALID).matches('^[A-za-z]+[A-Za-z0-9]+$'),
		check('email', errorConstant.EMAIL_INVALID).isEmail(),
		check('email', errorConstant.EMAIL_TOO_SHORT).isLength({ min: 5 }),

		check('enable2fa', errorConstant.ENABLE2FA_INVALID).custom(function(enable2fa) {
			if (parseInt(enable2fa) !== 1 && parseInt(enable2fa) !== 0) return false;
			return true;
		})
	];
};

//sử dụng middleware này cho việc chuyển tiền
module.exports.validateTransfer = function() {
	const errorConstant = errorListConstant.userErrorsConstant;
	const errorConstantTransfer = errorListConstant.accountErrorsConstant;
	return [
		check('verifyCode', errorConstant.VERIFYCODE_INVALID).isLength({ min: 1 }),
		check('accountId', errorConstantTransfer.ACCOUNTID_EMPTY).isLength({ min: 1 }),
		check('requestAccountId', errorConstantTransfer.REQUESTACCOUNTID_EMPTY).isLength({ min: 1 }),
		check('money', errorConstantTransfer.MONEY_EMPTY).isLength({ min: 1 })
	];
};

//sử dụng middleware này cho việc rút tiền
module.exports.validateWithdraw = function() {
	const errorConstant = errorListConstant.userErrorsConstant;
	return [ check('verifyCode', errorConstant.VERIFYCODE_INVALID).isLength({ min: 1 }) ];
};
