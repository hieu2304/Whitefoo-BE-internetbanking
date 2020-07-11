//gọi các hàm init các models mặc định như tỷ giá tiền tệ, lãi suất, tính phí ngân hàng...
const asyncHandler = require('express-async-handler');
const law_accumulatedService = require('../services/accounts/law_accumulated.service');
const law_paymentService = require('../services/accounts/law_payment.service');
const fee_paymentService = require('../services/accounts/fee_payment.service');
const exchange_CurrencyService = require('../services/currency/exchange_currency.service');

module.exports.initBaseValueAllNeededModel = asyncHandler(async function() {
	await law_accumulatedService.initBaseValueLaw_Accumulated();
	await law_paymentService.initBaseValueLaw_Payment();
	await fee_paymentService.initBaseValueFee_Payment();
	await exchange_CurrencyService.initBaseValueExchange_Currency();
	console.log('\nSERVER JUST INITIALIZED BASIC DATABASE VALUES FOR LAW&FEE TABLES...\n');
});
