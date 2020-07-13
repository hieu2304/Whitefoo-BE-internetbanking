const initHelper = require('../helpers/init.helper');
const currencyService = require('../services/currency/exchange_currency.service');
const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');
const updateExchangeThread = require('node-cron');
const updateDayAndTermThread = require('node-cron');

updateExchange = asyncHandler(async function() {
	await currencyService.updateExchangeRateUSDAndVND();
});

updateDaysAndTermPassedDaily = asyncHandler(async function() {
	await accountService.updateDaysAndTermsPassedForAccumulated();
});

module.exports.WhiteFooScheduleAll = function() {
	//init DB lần đầu khi khởi động server 6s
	setTimeout(initHelper.initBaseValueAllNeededModel, 6000);

	//mỗi 3 tiếng cập nhật tỷ giá VND USD 1 lần
	var temp = updateExchangeThread.schedule('* */3 * * *', () => {
		updateDaysAndTermPassedDaily();
	});

	//mỗi ngày chạy 1 lần lúc 12AM (0h sáng)
	//muốn test thì: gán 'phút_sắp_tới giờ_sắp_tới * * *'
	//  vd: chạy lúc 16h45 hằng ngày -> '45 16 * * *'
	var temp_2 = updateDayAndTermThread.schedule('0 0 * * *', () => {
		updateDaysAndTermPassedDaily();
	});
};
