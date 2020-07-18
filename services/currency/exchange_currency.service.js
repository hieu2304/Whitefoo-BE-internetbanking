const Sequelize = require('sequelize');
const db = require('../db');
const initConstant = require('../../constants/init.constants');
const Model = Sequelize.Model;
const requestService = require('request');
const moment = require('moment');
const asyncHandler = require('express-async-handler');

// https://github.com/MikeMcl/decimal.js/
const Decimal = require('decimal.js');

/*

READ THE API FROM THE THIRD SERVER:
https://www.freeforexapi.com/Home/Api

SPECIAL THANKS TO FREEFOREXAPI

*/

class exchange_currency extends Model {
	//hàm trả ra rate cho FE xài
	static async getRate() {
		const found = await exchange_currency.findAll();
		var result = {};
		result.usdvnd = found[0].rate;
		result.vndusd = found[1].rate;
		return result;
	}

	//hàm quy đổi tiền tệ
	//nếu currentCurrency = VND -> quy ra USD và ngược lại
	static async exchangeMoney(value, currentCurrency) {
		if (currentCurrency !== 'VND' && currentCurrency !== 'USD') return null;

		//đang VND -> chuyển sang USD
		if (currentCurrency === 'VND') {
			const rateResult = await exchange_currency.findRateByCurrency('VND', 'USD');
			var result = new Decimal(value).mul(rateResult.rate);

			return result;
		}

		//trường hợp còn lại: đang USD -> chuyển sang VND
		const rateResult = await exchange_currency.findRateByCurrency('USD', 'VND');
		var result = new Decimal(value).mul(rateResult.rate);

		return result;
	}

	//tìm tỷ giả theo đơn vị tiền
	static async findRateByCurrency(fromCurrency, toCurrency) {
		const result = await exchange_currency.findOne({
			where: {
				unitA: fromCurrency,
				unitB: toCurrency
			}
		});
		return result;
	}

	//cập nhật tỷ giá tiền tệ từ 1 USD = ? VND
	static async updateExchangeRateUSDAndVND() {
		console.log('\nServer is trying to get new Exchange Rate data...');
		var result = null;
		const myurl = 'https://www.freeforexapi.com/api/live?pairs=USDVND';

		requestService(
			myurl,
			asyncHandler(async function(err, respone, body) {
				body = JSON.parse(body);
				const data = body.rates.USDVND;
				var mydate = new Date(data.timestamp * 1000);
				var newDate = moment(mydate).format('DD-MM-YYYY hh:mm:ss');

				result = { rate: data.rate, time: newDate };

				if (result) {
					console.log('Server updated exchange rate USD and VND at ' + result.time);
					console.log('Current rate: 1 USD = ' + result.rate + ' VND\n');
					//USD to VND
					await exchange_currency.update(
						{
							rate: result.rate
						},
						{
							where: {
								unitA: 'USD',
								unitB: 'VND'
							}
						}
					);

					//VND to USD
					await exchange_currency.update(
						{
							rate: 1 / result.rate
						},
						{
							where: {
								unitA: 'VND',
								unitB: 'USD'
							}
						}
					);
				}
			})
		);
	}

	static async initBaseValueExchange_Currency() {
		//xóa dữ liệu cũ
		await exchange_currency.destroy({
			where: {},
			truncate: true
		});

		//thêm data chuẩn
		await exchange_currency.bulkCreate(initConstant.exchange_currencyBaseValue);
	}
}

exchange_currency.init(
	{
		unitA: {
			type: Sequelize.STRING,
			allowNull: false
		},
		unitB: {
			type: Sequelize.STRING,
			allowNull: false
		},
		rate: {
			//tỷ lệ chuyển đổi tiền tệ -> dùng khi nạp tiền cần chuyển đổi, hàm chuyển đổi sẽ cần
			type: Sequelize.DECIMAL
		},
		fee: {
			//phí khi chuyển đổi -> dùng khi chuyển khoản khác tiền tệ của 2 tài khoản, hàm chuyển khoản sẽ gọi
			type: Sequelize.DECIMAL,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'exchange_currency'
	}
);

module.exports = exchange_currency;

/* EXAMPLE
id				unitA				unitB				rate			fee
1				USD					VND					23211			0.005 (0.5%)
2				VND					USD					0,000043		0.005 (0.5%)
*/
