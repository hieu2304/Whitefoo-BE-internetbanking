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
			type: Sequelize.DATEONLY,
			allowNull: false
		},
		startTermDare: {
			type: Sequelize.DATEONLY,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'account_accumulated'
	}
);
