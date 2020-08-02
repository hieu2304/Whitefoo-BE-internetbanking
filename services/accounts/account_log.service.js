const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const moment = require('moment');
const exchange_currencyService = require('../currency/exchange_currency.service');
const errorListConstant = require('../../constants/errorsList.constant');
const Decimal = require('decimal.js');

class account_log extends Model {
	static async pushAccountLog_transfer(accountIdA, accountIdB, balance, currency, msg, status) {
		var filterAction = 'transfer';
		var action = accountIdA + ' chuyển khoản STK: ' + accountIdB;
		if (status === 0) {
			filterAction = 'transfer fail';
			action = accountIdA + ' chuyển khoản STK: ' + accountIdB + ' thất bại';
		}
		await account_log.pushAccountLog(accountIdA, accountIdB, balance, currency, msg, status, action, filterAction);
	}

	static async pushAccountLog_withdraw0(accountIdA, accountIdB, balance, currency, msg, status) {
		var filterAction = 'withdraw0';
		var action = 'Rút tiền từ TK thanh toán: ' + accountIdA;
		if (status === 0) {
			filterAction = 'withdraw0 fail';
			action = 'Rút tiền từ TK thanh toán: ' + accountIdA + ' thất bại';
		}
		await account_log.pushAccountLog(accountIdA, accountIdB, balance, currency, msg, status, action, filterAction);
	}

	static async pushAccountLog_withdraw1(accountIdA, accountIdB, balance, currency, msg, status) {
		var filterAction = 'withdraw1';
		var action = 'Rút tiền từ TK tiết kiệm: ' + accountIdA;
		if (status === 0) {
			filterAction = 'withdraw0 fail';
			action = 'Rút tiền từ TK tiết kiệm: ' + accountIdA + ' thất bại';
		}
		await account_log.pushAccountLog(accountIdA, accountIdB, balance, currency, msg, status, action, filterAction);
	}

	static async pushAccountLog_loadup(accountIdA, accountIdB, balance, currency, msg, status) {
		var filterAction = 'loadup';
		var action = 'Nạp tiền ' + accountIdA;
		if (status === 0) {
			filterAction = 'loadup fail';
			action = 'Nạp tiền STK: ' + accountIdB + ' thất bại';
		}
		await account_log.pushAccountLog(accountIdA, accountIdB, balance, currency, msg, status, action, filterAction);
	}
	static async pushAccountLog(accountIdA, accountIdB, balance, currency, msg, status, action, filterAction) {
		const newDetail = {}; //description
		const theTimeTotal = new moment();
		const newDate = moment(theTimeTotal).format('DD/MM/YYYY');
		const newTime = moment(theTimeTotal).format('hh:mm:ss');

		// xử lý description
		newDetail.accountIdA = accountIdA;
		newDetail.accountIdB = accountIdB;
		newDetail.currencyType = currency;
		newDetail.value = balance;
		newDetail.status = status;
		newDetail.date = newDate;
		newDetail.time = newTime;
		newDetail.message = msg;
		newDetail.action = action;

		await account_log.create({
			accountIdA: accountIdA,
			accountIdB: accountIdB,
			status: status,
			action: filterAction,
			value: balance,
			currencyType: currency,
			message: msg,
			description: JSON.stringify(newDetail),
			time: theTimeTotal
		});
	}
}

account_log.init(
	{
		accountIdA: {
			type: Sequelize.STRING,
			allowNull: true
		},
		accountIdB: {
			type: Sequelize.STRING,
			allowNull: true
		},
		time: {
			type: Sequelize.DATE,
			allowNull: false
		},
		value: {
			type: Sequelize.DECIMAL,
			allowNull: false,
			defaultValue: 0
		},
		currencyType: {
			type: Sequelize.STRING, //VND or USD
			allowNull: false,
			defaultValue: 'VND'
		},
		message: {
			type: Sequelize.STRING,
			allowNull: true
		},
		action: {
			type: Sequelize.STRING,
			allowNull: false
		},
		description: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		status: {
			type: Sequelize.INTEGER, //1: OK, 0: false
			allowNull: false,
			defaultValue: 1
		}
	},
	{
		sequelize: db,
		modelName: 'account_log'
	}
);

module.exports = account_log;
