const currencyService = require('../services/currency/exchange_currency.service');
const asyncHandler = require('express-async-handler');

module.exports.updateExchange = asyncHandler(async function() {
	await currencyService.updateExchangeRateUSDAndVND();
});
