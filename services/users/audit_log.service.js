const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class audit_log extends Model {}
audit_log.init(
	{
		internalUserId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		userId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		time: {
			type: Sequelize.DATE,
			allowNull: false
		},
		action: {
			type: Sequelize.STRING,
			allowNull: false
		},
		description: {
			type: Sequelize.TEXT,
			allowNull: true
		}
	},
	{
		sequelize: db,
		modelName: 'audit_log'
	}
);
