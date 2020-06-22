const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class citizen_identification extends Model {}

exchange_rate.init(
	{
		citizenIdentificationId: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		type: {
			type: Sequelize.STRING,
			allowNull: false
		},
		issueDate: {
			type: Sequelize.DATEONLY,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'citizen_identification'
	}
);
