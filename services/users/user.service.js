const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const randomHelper = require('../../helpers/random.helper');
const jwtHelper = require('../../helpers/jwt.helper');

class User extends Model {
	static async authenticationLoginAIO({ username, password }) {
		const authUser = await User.findOne({
			where: {
				[Op.or]:
				[{email: username},
				{CitizenIdentificationId: username},
				{phoneNumber: username}]
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;
		const user = await User.findOne({
			where: {
				[Op.or]:
				[{email: username},
				{CitizenIdentificationId: username},
				{phoneNumber: username}]
			},			
			attributes: {
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'dateOfBirth' ]
			}
		});
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
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'dateOfBirth' ]
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
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'dateOfBirth' ]
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
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'dateOfBirth' ]
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

		if (typeof request.citizenIdentificationId !== 'undefined' && request.citizenIdentificationId != null) {
			var isConflictCitizenIdentificationId = await User.checkConflictCitizenIdentificationId(
				request.citizenIdentificationId
			);
			if (isConflictCitizenIdentificationId) return isConflictCitizenIdentificationId;
		} else {
			return 'Empty citizenIdentificationId';
		}

		if (typeof request.phoneNumber !== 'undefined' && request.phoneNumber != null) {
			var isConflictPhoneNumber = await User.checkConflictPhoneNumber(request.phoneNumber);
			if (isConflictPhoneNumber) return isConflictPhoneNumber;
		} else {
			return 'Empty phoneNumber';
		}
		return null;
	}

	static async createNewUser(request) {
		const isUserConflict = await User.checkConflictUser(request);
		if (isUserConflict) return isUserConflict; //trả về lỗi conflict hoặc thiếu gì đó
		const newUser = await User.create({
			email: request.email,
			citizenIdentificationId: request.citizenIdentificationId || 'randomHelper.getRandomString(12)',
			fullName: request.fullName,
			dateOfBirth: Sequelize.DATE(request.dateOfBirth),
			phoneNumber: request.phoneNumber,
			password: await User.hashPassword(request.password)
		});
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
		fullName: {
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
			defaultValue: '1'
		},
		password: {
			type: Sequelize.STRING,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'user'
	}
);

module.exports = User;
