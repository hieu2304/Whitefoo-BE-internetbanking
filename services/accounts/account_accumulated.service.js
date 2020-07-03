const Sequelize = require('sequelize');
const db = require('../db');
const moment = require('moment');
const Model = Sequelize.Model;

class account_accumulated extends Model {
	static async createNewAccumulatedAccount(request, newAccountId) {
		const result = await account_accumulated.create({
			accountId: newAccountId,
			term: request.term,
			startTermDate: moment(new Date()).format('DD/MM/YYYY')
		});
		return result;
	}
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
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'account_accumulated'
	}
);

module.exports = account_accumulated;
