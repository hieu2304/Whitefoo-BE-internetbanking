const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const randomHelper = require('../../helpers/random.helper');

class account extends Model {
	static async checkIfExistAccountId(_id) {
		const isExist = await account.findOne({
			where: {
				accountId: _id
			}
		});
		if (isExist) return true;
		return false;
	}

	static async getUniqueRandomAccountId() {
		var randomAccountId = randomHelper.getRandomNumber(15);
		while (await account.checkIfExistAccountId(randomAccountId)) {
			randomAccountId = randomHelper.getRandomNumber(15);
		}
		return randomAccountId;
	}

	static async createNewAccount(request) {
		newAccountId = await account.getUniqueRandomAccountId();

		//nếu tài khoản thanh toán thì chỉ thêm bảng account

		//nếu tài khoản tiết kiệm, phải gọi và thêm vào account_accumulated
	}
}

account.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		userId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		balance: {
			type: Sequelize.DOUBLE, //a large number, use Long int or double
			allowNull: false
		},
		currencyType: {
			type: Sequelize.STRING,
			allowNull: false
		},
		accountType: {
			type: Sequelize.STRING,
			allowNull: false
		},
		openedDate: {
			type: Sequelize.DATEONLY,
			allowNull: false
		},
		closedDate: {
			type: Sequelize.DATEONLY,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'account'
	}
);
