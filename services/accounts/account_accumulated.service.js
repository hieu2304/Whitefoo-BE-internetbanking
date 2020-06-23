const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class account_accumulated extends Model {}

account_accumulated.init(
	{
		accountId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		term: {
			type: Sequelize.STRING,
			allowNull: false
		},
		startTermDare: {
			type: Sequelize.STRING,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'account_accumulated'
	}
);
