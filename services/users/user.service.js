const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const randomHelper = require('../../helpers/random.helper');
const jwtHelper = require('../../helpers/jwt.helper');

class User extends Model {
	static async authenticationLogin({ email, password }) {
		const authUser = await User.findOne({
			where: {
				email: email,
				password: password
			}
		});
		if (!authUser) throw 'Email or password is incorrect';

		const user = await User.findOne({
			where: {
				email: email,
				password: password
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
		if (conflictEmail.length > 0) throw 'conflict email';
	}

	static async checkConflictPhoneNumber(phoneNumber) {
		const conflictPhoneNumber = await User.findAll({
			where: {
				phoneNumber: phoneNumber
			}
		});
		if (conflictPhoneNumber.length > 0) throw 'conflict phoneNumber';
	}

	static async checkConflictCitizenIdentificationId(citizenIdentificationId) {
		const conflictCitizenIdentificationId = await User.findAll({
			where: {
				citizenIdentificationId: citizenIdentificationId
			}
		});
		if (conflictCitizenIdentificationId.length > 0) throw 'conflict citizenIdentificationId';
	}

	static async checkConflictUser(request) {
		if (typeof request.email !== 'undefined' && request.email != null) {
			await User.checkConflictEmail(request.email);
		}

		if (typeof request.citizenIdentificationId !== 'undefined' && request.citizenIdentificationId != null) {
			await User.checkConflictCitizenIdentificationId(request.citizenIdentificationId);
		}

		if (typeof request.phoneNumber !== 'undefined' && request.phoneNumber != null) {
			await User.checkConflictPhoneNumber(request.phoneNumber);
		}
		return null;
	}

	static async createNewUser(request) {
		const isUserConflict = await User.checkConflictUser(request);
		if (isUserConflict) throw 'conflict unexpected values';
		const newUser = await User.create({
			email: request.email,
			citizenIdentificationId: request.citizenIdentificationId || randomHelper.getRandomString(12),
			fullName: request.fullName,
			dateOfBirth: Sequelize.DATE(request.dateOfBirth),
			phoneNumber: request.phoneNumber,
			password: request.password
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
