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
			allowNull: false
        },
        message: {
			type: Sequelize.STRING,
			allowNull: false
        },
        value: {
			type: Sequelize.FLOAT,
			allowNull: false
        },
        transferType: {
			type: Sequelize.STRING,
			allowNull: false
        },
        status: {
			type: Sequelize.STRING,
			allowNull: false
        },
	},
	{
		sequelize: db,
		modelName: 'history_payment'
	}
);
