const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const law_paymentService = require('../accounts/law_payment.service');
const Decimal = require('decimal.js');

class history_payment extends Model {
	static async pushHistory_Payment(accountIdA, accountIdB, message, value, transferType, status) {
		const result = await history_payment.create({
			accountIdA: accountIdA,
			accountIdB: accountIdB,
			message: message,
			value: value,
			transferType: transferType,
			status: status,
			time: new Date()
		});
	}

	static async checkAccountLimit(accountId, value) {
		const list = await law_paymentService.getLawPayment();

		//check giới hạn trong cuộc giao dịch, max 200tr
		console.log(value);
		console.log(list[0].limit);
		if (parseFloat(value) > parseFloat(list[0].limit)) return 'transfer';

		const list = await history_payment.findAll({
			where: {
				accountIdA: accountId
			}
		});
		const thisDay = null;
		const thisMonth = null;
		var totalToDay = new Decimal(0.0);
		var totalThisMonth = new Decimal(0.0);
	}
}

history_payment.init(
	{
		accountIdA: {
			type: Sequelize.STRING,
			allowNull: false
		},
		accountIdB: {
			type: Sequelize.STRING,
			allowNull: true
		},
		time: {
			type: Sequelize.DATE,
			get: function() {
				return moment.utc(this.getDataValue('time')).format('DD/MM/YYYY hh:mm:ss');
			},
			allowNull: false
		},
		message: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		value: {
			type: Sequelize.DECIMAL,
			allowNull: false
		},
		transferType: {
			type: Sequelize.INTEGER, // 1 is transferring Internal Bank, 0 is transferring External Bank
			allowNull: false,
			defaultValue: 1
		},
		status: {
			type: Sequelize.INTEGER, // 1 is OK, 0 is failed
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'history_payment'
	}
);

module.exports = history_payment;
