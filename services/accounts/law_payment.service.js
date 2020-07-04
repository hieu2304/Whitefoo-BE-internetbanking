const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class law_payment extends Model {}

law_payment.init(
	{
		unit: {
			type: Sequelize.STRING,
			allowNull: false
		},
		limit: {
			type: Sequelize.DECIMAL,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'law_payment'
	}
);

/*
id			unit			limit
1			transfer		200tr
2			day				500tr
3			month			10tỷ
*/

module.exports = law_payment;
