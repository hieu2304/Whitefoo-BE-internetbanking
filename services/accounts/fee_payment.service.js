const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class fee_payment extends Model {}

fee_payment.init(
	{
		fee: {
			type: Sequelize.STRING,
			allowNull: false
		},
		value: {
			type: Sequelize.DOUBLE,
			allowNull: false
		},
		transferType: {
			type: Sequelize.STRING, // 0 is transferring Internal Bank, 1 is transferring External Bank
			allowNull: false,
			defaultValue: '0'
		}
	},
	{
		sequelize: db,
		modelName: 'fee_payment'
	}
);
