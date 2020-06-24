const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class law_payment extends Model {}

law_payment.init(
	{
		maxPerDay: {
			type: Sequelize.Double,
			allowNull: false
		},
		maxPerTransfer: {
			type: Sequelize.DOUBLE,
			allowNull: false
        },
        transferType: {
			type: Sequelize.STRING,
			allowNull: false
        }
	},
	{
		sequelize: db,
		modelName: 'law_payment'
	}
);