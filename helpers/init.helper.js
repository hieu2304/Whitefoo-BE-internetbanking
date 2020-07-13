//gọi các hàm init các models mặc định như tỷ giá tiền tệ, lãi suất, tính phí ngân hàng...
const asyncHandler = require('express-async-handler');
const law_accumulatedService = require('../services/accounts/law_accumulated.service');
const law_paymentService = require('../services/accounts/law_payment.service');
const fee_paymentService = require('../services/accounts/fee_payment.service');
const exchange_CurrencyService = require('../services/currency/exchange_currency.service');
const whitelistService = require('../services/partner/whitelist.service');

module.exports.initBaseValueAllNeededModel = asyncHandler(async function() {
	//các quy định lãi suất của tài khoản tiết kiệm
	await law_accumulatedService.initBaseValueLaw_Accumulated();

	//các quy định giới hạn của tài khoản thanh toán
	await law_paymentService.initBaseValueLaw_Payment();

	//các quy định về chi phí chuyển khoản
	await fee_paymentService.initBaseValueFee_Payment();

	//bảng giá quy đổi USD và VND
	await exchange_CurrencyService.initBaseValueExchange_Currency();

	//bảng các đối tác ngân hàng khác co-op
	await whitelistService.initBaseValueWhitelist();

	// uncomment the line below when release to a real-server
	//await exchange_CurrencyService.updateExchangeRateUSDAndVND();

	console.log('\nSERVER JUST INITIALIZED BASIC DATABASE VALUES FOR TABLES: LAW, FEE, ETC...\n');
});
