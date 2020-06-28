const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class audit_log extends Model {
	static async pushAuditLog(internalUserId, userId, action, description) {
		//check Empty later
		const newLog = await audit_log.create({
			internalUserId: internalUserId,
			userId: userId,
			action: action,
			description: description,
			time: new Date()
		});
	}
}
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
