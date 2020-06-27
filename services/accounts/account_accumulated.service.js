const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class account_accumulated extends Model {}

account_accumulated.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		term: {
			type: Sequelize.NUMBER, //number of months: example: 3 months -> 3, 12 months->12
			allowNull: false
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
