const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class exchange_rate extends Model {}

exchange_rate.init(
	{
		unitA: {
			type: Sequelize.STRING,
			allowNull: false
		},
		unitB: {
			type: Sequelize.STRING,
			allowNull: false
		},
		value: {
			type: Sequelize.DOUBLE,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'exchange_rate'
	}
);
