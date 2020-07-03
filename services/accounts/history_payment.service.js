const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class history_payment extends Model {}

history_payment.init(
	{
		accountIdA: {
			type: Sequelize.STRING,
			allowNull: false
		},
		accountIdB: {
			type: Sequelize.STRING,
			allowNull: false
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
			type: Sequelize.STRING, // 0 is transferring Internal Bank, 1 is transferring External
			allowNull: false,
			defaultValue: '0'
		},
		status: {
			type: Sequelize.STRING,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'history_payment'
	}
);

module.exports = history_payment;
