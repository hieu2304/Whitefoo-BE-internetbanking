const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const moment = require('moment');
const exchange_currencyService = require('../currency/exchange_currency.service');
const errorListConstant = require('../../constants/errorsList.constant');
const Decimal = require('decimal.js');

class account_log extends Model {}

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
