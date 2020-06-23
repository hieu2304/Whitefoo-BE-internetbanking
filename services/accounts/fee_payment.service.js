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
			type: Sequelize.STRING,
			allowNull: false
        },
        transferType: {
			type: Sequelize.STRING,
			allowNull: false
        }
	},
	{
		sequelize: db,
		modelName: 'fee_payment'
	}
);
