const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const moment = require('moment');

class audit_log extends Model {
	static async getAuditLog(request) {
		//add filter here
		const list = await audit_log.findAll();
		const result = [];

		for (var i = 0; i < list.length; i++) {
			result.push(JSON.parse(list[i].description));
		}

		return result;
	}

	static async pushAuditLog_ApproveIdCard(internalUser, user, approveStatus) {
		var filterAction = 'approve idCard';
		var action = 'Duyệt CMND/CCCD';
		if (approveStatus === 0) {
			filterAction = 'denined idCard';
			action = 'Từ chối CMND/CCCD';
		}

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog(internalUser, user, action, filterAction) {
		const newDetail = {};
		const theTimeTotal = new moment();
		const newDate = moment(theTimeTotal).format('DD/MM/YYYY');
		const newTime = moment(theTimeTotal).format('hh:mm:ss');

		const id_a = internalUser.id;
		const id_b = user.id;
		const fullName_a = internalUser.firstName + ' ' + internalUser.lastName;
		const fullName_b = user.firstName + ' ' + user.lastName;

		newDetail.id_a = id_a;
		newDetail.id_b = id_b;
		newDetail.fullName_a = fullName_a;
		newDetail.fullName_b = fullName_b;
		newDetail.date = newDate;
		newDetail.time = newTime;
		newDetail.action = action;

		await audit_log.create({
			internalUserId: id_a,
			userId: id_b,
			action: filterAction,
			description: JSON.stringify(newDetail),
			time: theTimeTotal
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
