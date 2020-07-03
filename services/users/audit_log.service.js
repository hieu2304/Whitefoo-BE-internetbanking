const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const moment = require('moment');

class audit_log extends Model {
	static async getAuditLog(internalUserId) {
		//add filter later
		const list = audit_log.findAll();
		return list;
	}

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
			allowNull: false,
			defaultValue: new Date(),
			get: function() {
				return moment.utc(this.getDataValue('time')).format('DD/MM/YYYY hh:mm:ss');
			}
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

module.exports = audit_log;
