const initHelper = require('../helpers/init.helper');
const currencyService = require('../services/currency/exchange_currency.service');
const accountService = require('../services/accounts/account.service');
const system_logService = require('../services/system/system_log.service');
const asyncHandler = require('express-async-handler');
const updateExchangeThread = require('node-cron');
const updateDayAndTermThread = require('node-cron');

updateExchangeRate = asyncHandler(async function() {
	await currencyService.updateExchangeRateUSDAndVND();
	await system_logService.pushSystemLogAutoUpdateExchange();
});

updateDaysAndTermPassed = asyncHandler(async function() {
	await accountService.updateDaysAndTermsPassedForAccumulated();
	await system_logService.pushSystemLogAutoUpdateAccumulated();
	console.log('\nServer updated days&terms for accumulated accounts...\n');
});

module.exports.WhiteFooScheduleAll = function() {
	//init DB lần đầu khi khởi động server 8s
	setTimeout(initHelper.initBaseValueAllNeededModel, 8000);

	//mỗi 3 tiếng cập nhật tỷ giá VND USD 1 lần
	//các khung giờ cập nhật:
	//1:05, 4:05, 7:05, 10:05, 13:05, 16:05, 19:05, 22:05
	var temp = updateExchangeThread.schedule('5 1,4,7,10,13,16,19,22 * * *', () => {
		updateExchangeRate();
	});

	//mỗi ngày chạy 1 lần lúc 12:00AM (0h 0phút sáng)
	//muốn test thì: gán 'phút_sắp_tới giờ_sắp_tới * * *'
	//  vd: chạy lúc 16h45 hằng ngày -> '45 16 * * *'
	var temp_2 = updateDayAndTermThread.schedule('0 0 * * *', () => {
		updateDaysAndTermPassed();
	});
};
