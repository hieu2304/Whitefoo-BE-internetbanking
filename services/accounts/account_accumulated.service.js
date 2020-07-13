const Sequelize = require('sequelize');
const db = require('../db');
const moment = require('moment');
const Model = Sequelize.Model;
const law_accumulatedService = require('../accounts/law_accumulated.service');

class account_accumulated extends Model {
	static async getAccountAccumulatedById(accountId) {
		const result = await account_accumulated.findOne({
			where: {
				accountId: accountId
			}
		});

		return result;
	}

	static async createNewAccumulatedAccount(request, newAccountId) {
		const result = await account_accumulated.create({
			accountId: newAccountId,
			term: request.term,
			startTermDate: moment()
		});
		return result;
	}

	//các hàm tính lãi
}

account_accumulated.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		term: {
			type: Sequelize.INTEGER, //number of months: example: 3 months -> 3, 12 months->12
			allowNull: false,
			defaultValue: 3
		},
		startTermDate: {
			type: Sequelize.DATEONLY,
			get: function() {
				return moment.utc(this.getDataValue('startTermDate')).format('DD/MM/YYYY');
			},
			allowNull: false
		},

		//đếm số ngày đã qua để khi rút tiền để tính toán tiền lãi
		daysPassed: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0
		},

		//đếm số kỳ hạn đã qua, nếu 1 người nào ko rút sau 1 kỳ hạn trôi qua
		//thì tiền lãi sẽ được tính vào vốn ở kỳ hạn tiếp theo
		termsPassed: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	},
	{
		sequelize: db,
		modelName: 'account_accumulated'
	}
);

module.exports = account_accumulated;
