const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class law_payment extends Model {}

law_payment.init(
	{
		maxPerDay: {
			type: Sequelize.DOUBLE,
			allowNull: false
		},
		maxPerTransfer: {
			type: Sequelize.DOUBLE,
			allowNull: false
		},
		transferType: {
			type: Sequelize.STRING, // 0 is transferring Internal Bank, 1 is transferring External
			allowNull: false,
			defaultValue: '0'
		}
	},
	{
		sequelize: db,
		modelName: 'law_payment'
	}
);
