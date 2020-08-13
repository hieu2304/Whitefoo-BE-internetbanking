const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
var moment = require('moment');
moment().utcOffset('+07:00');

class audit_log extends Model {
	static async getAuditLog(request, internalIdList) {
		//bộ lọc
		const type = typeof request.type !== 'undefined' ? request.type : 'all';

		//phân trang
		var limit = request.limit;
		var start = request.start;

		if (!limit) {
			limit = 3;
		}
		if (!start) {
			start = 0;
		}
		start = start * limit;

		//các tiêu chí lọc mặc định
		//action mặc định là tất cả
		var actionArr = [
			'denied idCard',
			'approve idCard',
			'create account',
			'add balance',
			'edit user',
			'edit account',
			'withdraw'
		];

		//lọc theo yêu cầu
		if (type === 'approve') {
			actionArr = [ 'approve idCard' ];
		} else if (type === 'deny') {
			actionArr = [ 'denied idCard' ];
		} else if (type === 'verifyuser') {
			actionArr = [ 'approve idCard', 'denied idCard' ];
		} else if (type === 'addbalance' || type === 'loadup') {
			actionArr = [ 'add balance' ];
		} else if (type === 'createaccount') {
			actionArr = [ 'create account' ];
		} else if (type === 'edituser') {
			actionArr = [ 'edit user' ];
		} else if (type === 'editaccount') {
			actionArr = [ 'edit account' ];
		} else if (type === 'withdraw') {
			actionArr = [ 'withdraw' ];
		}

		const totalList = await audit_log.findAndCountAll({
			where: {
				action: actionArr,
				internalUserId: internalIdList
			},
			offset: Number(start),
			limit: Number(limit),
			order: [ [ 'createdAt', 'DESC' ] ]
		});
		const result = [];

		for (var i = 0; i < totalList.rows.length; i++) {
			result.push(JSON.parse(totalList.rows[i].description));
		}

		return { count: totalList.count, list: result };
	}

	static async pushAuditLog_EditAccount(internalUser, user, accountId) {
		var filterAction = 'edit account';
		var action = 'chỉnh sửa tài khoản ' + accountId;

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog_EditUser(internalUser, user) {
		var filterAction = 'edit user';
		var action = 'chỉnh sửa thông tin';

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog_ApproveIdCard(internalUser, user, approveStatus) {
		var filterAction = 'approve idCard';
		var action = 'duyệt CMND/CCCD';
		if (approveStatus === 0) {
			filterAction = 'denied idCard';
			action = 'từ chối CMND/CCCD';
		}

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog_CreateAccount(internalUser, user, accountId) {
		var filterAction = 'create account';
		var action = 'tạo tài khoản ' + accountId;

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog_AddBalance(internalUser, user, value, currencyType, accountId) {
		var filterAction = 'add balance';
		var frontEndDisplay = currencyType === 'VND' ? '₫' : '$';
		frontEndDisplay = frontEndDisplay + value;
		var action = 'nạp tiền ' + frontEndDisplay + ' vào tài khoản ' + accountId;

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog_Withdraw(internalUser, user, value, currencyType, accountId) {
		var filterAction = 'withdraw';
		var frontEndDisplay = currencyType === 'VND' ? '₫' : '$';
		frontEndDisplay = frontEndDisplay + value;
		var action = 'rút ' + frontEndDisplay + ' từ tài khoản ' + accountId;

		await audit_log.pushAuditLog(internalUser, user, action, filterAction);
	}

	static async pushAuditLog(internalUser, user, action, filterAction) {
		const newDetail = {};
		const theTimeTotal = new moment();
		const newDate = moment(theTimeTotal).format('DD/MM/YYYY');
		const newTime = moment(theTimeTotal).format('HH:mm:ss');

		const id_a = internalUser.id;
		const id_b = user.id;
		const fullName_a = internalUser.firstName + ' ' + internalUser.lastName;
		const fullName_b = user.firstName + ' ' + user.lastName;

		newDetail.id_user = id_a;
		newDetail.id_target = id_b;
		newDetail.fullName_user = fullName_a;
		newDetail.fullName_target = fullName_b;
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
				return moment(this.getDataValue('time')).format('DD/MM/YYYY HH:mm:ss');
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
