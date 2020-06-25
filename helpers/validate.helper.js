const { check, validationResult, body } = require('express-validator');
const moment = require('moment');

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

module.exports.validateRegisterInformation = function() {
	var confirmPassword = '';
	return [
		body('confirmpassword').custom(function(inputConfirmPassword) {
			internalConfirmPassword = inputConfirmPassword;
			return true;
		}),

		check('email', 'Invalid email type').isEmail(),
		check('email', 'Email to short, min is 5').isLength({ min: 5 }),

		check('userName', 'userName to short, min is 6').isLength({ min: 6 }),
		check('userName', 'userName to long, max is 20').isLength({ max: 20 }),
		check('userName', 'userName only can be alphabetic and number, start with alphabetic').matches(
			'^[A-za-z]+[A-Za-z0-9]+$'
		),

		check('password', 'password to short, min is 9').isLength({ min: 9 }),
		check('password', 'password to long, max is 40').isLength({ max: 40 }),
		check('password', 'password must start with alphabetic').matches('^[A-za-z]'),
		check('password', 'password not equals to confirmpassword').custom(function(password) {
			if (password === internalConfirmPassword) return true;
			return false;
		}),

		check('lastName', 'lastName to short, min is 3').isLength({ min: 3 }),
		check('lastName', 'lastName to long, max is 20').isLength({ max: 20 }),
		check('lastName', 'lastName only can be alphabetic, number and dot').matches('^[A-Za-z0-9.]+$'),

		check('firstName', 'firstName to short, min is 3').isLength({ min: 3 }),
		check('firstName', 'firstName to long, max is 20').isLength({ max: 20 }),
		check('firstName', 'firstName only can be alphabetic, number and dot').matches('^[A-Za-z0-9.]+$'),

		check('address', 'address to short, min is 6').isLength({ min: 6 }),
		check('address', 'address to long, max is 60').isLength({ max: 60 }),

		check('phoneNumber', 'phoneNumber to short, min is 3').isLength({ min: 3 }),
		check('phoneNumber', 'phoneNumber to long, max is 20').isLength({ max: 20 }),
		check('phoneNumber', 'phoneNumber only can be number or number with 1 plus at start').custom(function(
			phoneNumber
		) {
			var firstNumber = String(phoneNumber).slice(0, 1);
			var lastNumber = String(phoneNumber).slice(1);
			//nếu ký tự đầu ko phải dấu + và cũng ko phải là số thì sai
			if (firstNumber != '+' && !isNumber(firstNumber)) return false;
			if (!isNumber(lastNumber)) return false;
			return true;
		}),

		check('dateOfBirth', 'invalid dateOfBirth').custom(function(dateOfBirth) {
			return moment(dateOfBirth, [ 'DD/MM/YYYY', 'YYYY/MM/DD', 'MM/DD/YYYY' ]).isValid();

			//moment(scope.modelValue, 'DD-MMM-YYYY HH:mm a', true).isValid()
			//moment(checked_date, DATE_FORMAT).format(DATE_FORMAT) === checked_date
			//moment(checked_date, [DATE_FORMAT1, DATE_FORMAT2]).format(DATE_FORMAT) === checked_date
		})
	];
};

module.exports.validateLoginInformation = function(request) {};
