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
			type: Sequelize.DECIMAL,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'exchange_rate'
	}
);

module.exports = exchange_rate;

/* EXAMPLE
id				unitA				unitB				value
1				USD					VND					23211
2				VND					USD					0,000043
*/
