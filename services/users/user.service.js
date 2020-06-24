const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const randomHelper = require('../../helpers/random.helper');
const jwtHelper = require('../../helpers/jwt.helper');
const Op = Sequelize.Op;
class User extends Model {
	static async findUserNoneExclude(username) {
		const user = await User.findOne({
			where: {
				[Op.or]: [ { email: username }, { citizenIdentificationId: username }, { phoneNumber: username } ]
			}
		});
		return user;
	}
	static async findUserUsingExclude(username) {
		const user = await User.findOne({
			where: {
				[Op.or]: [ { email: username }, { citizenIdentificationId: username }, { phoneNumber: username } ]
			},
			attributes: {
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'verifyCode' ]
			}
		});
		return user;
	}

	static async authenticationLoginAIO({ username, password }) {
		const authUser = await User.findUserNoneExclude(username);
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;
		const user = await User.findUserUsingExclude(username);
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async authenticationLoginByEmail({ email, password }) {
		const authUser = await User.findOne({
			where: {
				email: email
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;
		const user = await User.findOne({
			where: {
				email: email
			},
			attributes: {
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'verifyCode' ]
			}
		});
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async authenticationLoginByPhoneNumber({ phoneNumber, password }) {
		const authUser = await User.findOne({
			where: {
				phoneNumber: phoneNumber
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;

		const user = await User.findOne({
			where: {
				phoneNumber: phoneNumber
			},
			attributes: {
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'verifyCode' ]
			}
		});
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async authenticationLoginByCitizenIdentificationId({ citizenIdentificationId, password }) {
		const authUser = await User.findOne({
			where: {
				citizenIdentificationId: citizenIdentificationId
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;

		const user = await User.findOne({
			where: {
				citizenIdentificationId: citizenIdentificationId
			},
			attributes: {
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'verifyCode' ]
			}
		});
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async checkConflictEmail(email) {
		const conflictEmail = await User.findAll({
			where: {
				email: email
			}
		});
		if (conflictEmail.length > 0) return 'Conflict email';
		return null;
	}

	static async checkConflictPhoneNumber(phoneNumber) {
		const conflictPhoneNumber = await User.findAll({
			where: {
				phoneNumber: phoneNumber
			}
		});
		if (conflictPhoneNumber.length > 0) return 'Conflict phone number';
		return null;
	}

	static async checkConflictCitizenIdentificationId(citizenIdentificationId) {
		const conflictCitizenIdentificationId = await User.findAll({
			where: {
				citizenIdentificationId: citizenIdentificationId
			}
		});
		if (conflictCitizenIdentificationId.length > 0) return 'Conflict citizenIdentificationId';
		return null;
	}

	static async checkConflictUser(request) {
		if (typeof request.email !== 'undefined' && request.email != null) {
			var isConflictEmail = await User.checkConflictEmail(request.email);
			if (isConflictEmail) return isConflictEmail;
		} else {
			return 'Empty email';
		}

		// if (typeof request.citizenIdentificationId !== 'undefined' && request.citizenIdentificationId != null) {
		// 	var isConflictCitizenIdentificationId = await User.checkConflictCitizenIdentificationId(
		// 		request.citizenIdentificationId
		// 	);
		// 	if (isConflictCitizenIdentificationId) return isConflictCitizenIdentificationId;
		// } else {
		// 	return 'Empty citizenIdentificationId';
		// }

		if (typeof request.phoneNumber !== 'undefined' && request.phoneNumber != null) {
			var isConflictPhoneNumber = await User.checkConflictPhoneNumber(request.phoneNumber);
			if (isConflictPhoneNumber) return isConflictPhoneNumber;
		} else {
			return 'Empty phoneNumber';
		}
		return null;
	}

	static async verifyEmailCode(_code) {
		const isExist = await User.findOne({
			where: {
				verifyCode: _code
			}
		});
		if (isExist) {
			await User.update(
				{
					verifyCode: ''
				},
				{
					where: { verifyCode: _code }
				}
			);
			return isExist;
		}
		return null;
	}

	static async checkUserVerifyEmailCodeYet(request) {
		const isExist = await User.findOne({
			where: {
				email: request.email,
				verifyCode: ''
			}
		});
		if (isExist) return isExist;
		return null;
	}

	static async checkIfExistVerifyCode(_code) {
		const isExist = await User.findOne({
			where: {
				verifyCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}

	static async checkIfExistForgotCode(_code) {
		const isExist = await User.findOne({
			where: {
				forgotCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}

	//hàm này đảm bảo code random được tạo ra là độc nhất, đang không tồn tại trong DB
	static async getUniqueRandomCode() {
		var randomCode = randomHelper.getRandomString(15);
		while ((await User.checkIfExistVerifyCode(randomCode)) || (await User.checkIfExistForgotCode(randomCode))) {
			randomCode = randomHelper.getRandomString(15);
		}
		return randomCode;
	}

	static async createNewUser(request) {
		const isUserConflict = await User.checkConflictUser(request);
		if (isUserConflict) return isUserConflict; //trả về lỗi conflict hoặc thiếu gì đó

		const newVerifyCode = await User.getUniqueRandomCode();
		const newUser = await User.create({
			email: request.email,
			citizenIdentificationId: 'empty=[' + new Date().toISOString() + ']=' + randomHelper.getRandomString(10),
			lastName: request.lastName,
			firstName: request.firstName,
			dateOfBirth: Sequelize.DATE(request.dateOfBirth),
			phoneNumber: request.phoneNumber,
			password: await User.hashPassword(request.password),
			verifyCode: newVerifyCode
		});

		//send email here

		return newUser;
	}

	static hashPassword(passwordInput) {
		return bcrypt.hashSync(passwordInput, 10);
	}

	static verifyPassword(passwordsUnHashed, passwordsHashed) {
		return bcrypt.compareSync(passwordsUnHashed, passwordsHashed);
	}
}
User.init(
	{
		email: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		citizenIdentificationId: {
			type: Sequelize.STRING,
			allowNull: true,
			unique: true
		},
		lastName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		firstName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		dateOfBirth: {
			type: Sequelize.DATEONLY,
			allowNull: false
		},
		phoneNumber: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		userType: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: '1' // 1 = member, 0 = internal user
		},
		password: {
			type: Sequelize.STRING,
			allowNull: false
		},
		verifyCode: {
			type: Sequelize.STRING,
			allowNull: true
		},
		forgotCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		}
	},
	{
		sequelize: db,
		modelName: 'user'
	}
);

module.exports = User;
