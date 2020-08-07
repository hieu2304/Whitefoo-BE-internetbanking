const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const moment = require('moment');

class system_log extends Model {
	static async pushSystemLogAutoUpdateExchange() {
		await system_log.pushSystemLog(-1, 'update exchange rate', 'system update each 3h');
	}
	static async pushSystemLogAutoUpdateAccumulated() {
		await system_log.pushSystemLog(-1, 'update accumulated', 'system update daily');
	}

	static async pushSystemLog(userId, action, description) {
		if (!userId) userId = -1;
		await system_log.create({
			userId: userId,
			action: action,
			description: description,
			time: new Date()
		});
	}
}
system_log.init(
	{
		userId: {
			type: Sequelize.INTEGER,
			allowNull: false // -1 là system
		},
		time: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: new Date(),
			get: function() {
				return moment.utc(this.getDataValue('time')).format('DD/MM/YYYY HH:mm:ss');
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
		modelName: 'system_log'
	}
);

module.exports = system_log;
