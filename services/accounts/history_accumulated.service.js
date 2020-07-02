const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class history_accumulated extends Model {}

history_accumulated.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		time: {
			type: Sequelize.DATE,
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
		status: {
			type: Sequelize.STRING,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'history_accumulated'
	}
);

module.exports = history_accumulated;
