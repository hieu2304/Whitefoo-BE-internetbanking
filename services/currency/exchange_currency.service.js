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

READ THE API-A FROM THE THIRD SERVER:
https://www.freeforexapi.com/Home/Api



READ THE API-B FROM:
http://www.floatrates.com/


READ THE API-C FROM:
https://www.currencyconverterapi.com/docs

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

	//hàm này sẽ được gọi khi server ta call 1 API bên thứ 3 và khi call có data trả về
	static async updateRateFromDataAPI(USDtoVND_rate) {
		await exchange_currency.update(
			{
				rate: USDtoVND_rate
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
				rate: 1 / USDtoVND_rate
			},
			{
				where: {
					unitA: 'VND',
					unitB: 'USD'
				}
			}
		);

		console.log(
			'\nServer updated exchange rate USD and VND at ' + moment(new Date()).format('DD/MM/YYYY hh:mm:ss')
		);
		console.log('Current rate: 1 USD = ' + USDtoVND_rate + ' VND\n');
	}

	//API C: currconv
	static async getRateFromCurrconv() {
		const MyURL = 'https://free.currconv.com/api/v7/convert?q=USD_VND&compact=ultra&apiKey=d193d78dc13089ff2112';

		requestService(
			MyURL,
			asyncHandler(async function(err, response, body) {
				const allData = JSON.parse(body);

				if (typeof allData.USD_VND !== 'undefined') {
					const data = allData.USD_VND;
					await exchange_currency.updateRateFromDataAPI(data);
				} else {
					console.log('\nFailed to get data from currconv, Server will try again later');
				}
			})
		);
	}

	//API B: floatrates
	static async getRateFromFloatRates() {
		const MyURL = 'http://www.floatrates.com/daily/vnd.json';

		requestService(
			MyURL,
			asyncHandler(async function(err, response, body) {
				const allData = JSON.parse(body);

				if (allData.usd && typeof allData.usd.inverseRate !== 'undefined') {
					const data = allData.usd.inverseRate;
					await exchange_currency.updateRateFromDataAPI(data);
				} else {
					console.log('\nFailed to get data from floatrates, trying another API...');
					await exchange_currency.getRateFromCurrconv();
				}
			})
		);
	}

	//cập nhật tỷ giá tiền tệ từ 1 USD = ? VND theo thứ tự API (Phòng TH api dead)
	//API A: api từ FreeForExAPI
	static async updateExchangeRateUSDAndVND() {
		console.log('\nServer is trying to get new Exchange Rate data...');
		var result = null;
		const MyURL = 'https://www.freeforexapi.com/api/live?pairs=USDVND';

		requestService(
			MyURL,
			asyncHandler(async function(err, response, body) {
				body = JSON.parse(body);

				if (body.rates && typeof body.rates.USDVND !== 'undefined') {
					const data = body.rates.USDVND;
					await exchange_currency.updateRateFromDataAPI(data);
				} else {
					console.log('\nFailed to get data from freeforexapi, trying another API...');
					//call API B
					await exchange_currency.getRateFromFloatRates();
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
