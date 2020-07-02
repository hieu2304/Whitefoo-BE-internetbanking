const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class law_accumulated extends Model {}

law_accumulated.init(
	{
		term: {
			type: Sequelize.INTEGER, //number of months: example: 3 months -> 3, 12 months->12
			allowNull: false
		},
		value: {
			type: Sequelize.DECIMAL,
			allowNull: false
		},
		percent: {
			type: Sequelize.DECIMAL, // 2% -> 0.02, 10% ->0.1
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'law_accumulated'
	}
);

module.exports = law_accumulated;
