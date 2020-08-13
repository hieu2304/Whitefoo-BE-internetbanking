const Sequelize = require('sequelize');
const db = require('../db');
const Op = Sequelize.Op;
const Model = Sequelize.Model;
var moment = require('moment');
moment().utcOffset('+07:00');
const exchange_currencyService = require('../currency/exchange_currency.service');
const law_paymentService = require('../accounts/law_payment.service');
const Decimal = require('decimal.js');

class account_log extends Model {
	//hàm lấy lịch sử giao dịch của danh sách STK (hỡ trợ 2 api getlog)
	static async getAccountLogByAccountIdArr(accountIdArr, type, fromDateIn, toDateIn, start, limit) {
		var fromDate = fromDateIn;
		var toDate = toDateIn;
		//tạo now = ngày hiện tại +2 ngày, chuẩn format YYYY-MM-DD HH:mm:ss
		var now = moment().add(2, 'days');
		now = moment(now).format('YYYY-MM-DD');
		now = now + ' 23:59:59';

		var actionArr = [ 'transfer', 'loadup', 'withdraw' ];
		if (!limit) {
			limit = 5;
		}
		if (!start) {
			start = 0;
		}
		start = start * limit;

		if (!accountIdArr || accountIdArr.length < 1) return { count: 0, rows: [] };

		if (type === 'transfer') actionArr = [ 'transfer' ];
		else if (type === 'loadup') actionArr = [ 'loadup' ];
		else if (type === 'withdraw') actionArr = [ 'withdraw' ];

		//nếu ko truyền thì mặc định là 0h0p0s 1/1/2000
		if (!fromDate) fromDate = '2000-01-01 00:00:01';
		else {
			fromDate = fromDate + ' 00:00:01';
			fromDate = moment(fromDate, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');

			if (fromDate == 'Invalid date') {
				fromDate = '2000-01-01 00:00:01';
			}
		}

		if (!toDate) toDate = now;
		else {
			toDate = toDate + ' 23:59:58';
			toDate = moment(toDate, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');

			if (toDate == 'Invalid date') {
				toDate = now;
			}
		}

		//fromDate & toDate tới chỗ này thì phải theo dạng YYYY-MM-DD HH:mm:ss dù là trường hợp nào
		fromDate = moment(fromDate, 'YYYY-MM-DD HH:mm:ss').utcOffset('+07:00').format();
		toDate = moment(toDate, 'YYYY-MM-DD HH:mm:ss').utcOffset('+07:00').format();

		const result = await account_log.findAndCountAll({
			where: {
				[Op.or]: [ { accountIdA: accountIdArr }, { accountIdB: accountIdArr } ],
				action: actionArr,
				time: {
					[Op.between]: [ fromDate, toDate ]
				}
			},
			offset: Number(start),
			limit: Number(limit),
			order: [ [ 'createdAt', 'DESC' ] ]
		});

		return result;
	}

	//hàm tính tổng giá trị 1 tài khoản đã thanh toán trong 1 ngày, 1 tháng
	static async sumValueTransfer(accountId) {
		const listLog = await account_log.findAll({
			where: {
				accountIdA: accountId,
				action: 'transfer'
			}
		});
		var dayTotal = new Decimal(0);
		var monthTotal = new Decimal(0);

		var now = new moment().utcOffset('+07:00');
		var thisDay = moment(now).date();
		var thisMonth = moment(now).month() + 1; //tháng nó đếm từ 0
		var thisYear = moment(now).year();

		for (var i = 0; i < listLog.length; i++) {
			if (moment(listLog[i].time).month() + 1 === thisMonth && moment(listLog[i].time).year() === thisYear) {
				monthTotal = new Decimal(monthTotal).plus(listLog[i].value);
				if (listLog[i].currencyType !== 'VND') {
					monthTotal = await exchange_currencyService.exchangeMoney(monthTotal, 'USD');
				}
				if (moment(listLog[i].time).date() === thisDay) {
					dayTotal = new Decimal(dayTotal).plus(listLog[i].value);
					if (listLog[i].currencyType !== 'VND') {
						dayTotal = await exchange_currencyService.exchangeMoney(dayTotal, 'USD');
					}
				}
			}
		}

		return { dayTotal, monthTotal };
	}

	//hàm tính giới hạn của 1 tài khoản để xem tài khoản đó có đạt giới hạn thanh toán ko
	static async checkAccountOverLimitTransfer(foundAccount, valueInput, currencyType) {
		var value = valueInput;
		if (currencyType !== 'VND') {
			value = await exchange_currencyService.exchangeMoney(value, currencyType);
		}

		const valueTransferred = await account_log.sumValueTransfer(foundAccount.accountId);

		const listLaw = await law_paymentService.getLawPayment();
		if (parseFloat(value) >= parseFloat(listLaw[0].limit)) {
			return 'transfer';
		}
		if (parseFloat(new Decimal(value).plus(valueTransferred.dayTotal)) >= parseFloat(listLaw[1].limit)) {
			return 'day';
		}
		if (parseFloat(new Decimal(value).plus(valueTransferred.monthTotal)) >= parseFloat(listLaw[2].limit)) {
			return 'month';
		}

		return null;
	}

	//transferBank để biết chuyển nội bộ hay liên ngân hàng
	static async pushAccountLog_transfer(transferBank, accountIdA, accountIdB, value, currencyType, msg, status) {
		var filterAction = 'transfer';
		var action = 'Chuyển khoản';
		var bankId = '';

		//khác ngân hàng thì điền vào trả cho FE, vd: chuyển khoản (ngân hàng ARG)
		if (transferBank && transferBank !== '' && transferBank !== 'wfb') {
			bankId = transferBank;
		}

		await account_log.pushAccountLog(
			accountIdA,
			accountIdB,
			bankId,
			action,
			filterAction,
			value,
			currencyType,
			msg,
			status
		);
	}

	//rút tiền cho tài khoản tiết kiệm + thanh toán, valueTotal vì có thể là vốn+lời
	// typeOfWithdraw: accountType, nếu 0 là payment, 1 là accumulated
	static async pushAccountLog_withdraw(typeOfWithdraw, accountIdA, valueTotal, currencyType, msg, status) {
		var filterAction = 'withdraw';
		var action = 'Rút tiền (TKTT)';
		if (typeOfWithdraw === 1 || typeOfWithdraw === '1') action = 'Rút tiền (TKTK)';

		await account_log.pushAccountLog(
			accountIdA,
			'',
			'',
			action,
			filterAction,
			valueTotal,
			currencyType,
			msg,
			status
		);
	}

	static async pushAccountLog_loadUp(accountIdA, value, currencyType, msg, status) {
		var filterAction = 'loadup';
		var action = 'Nạp tiền';

		await account_log.pushAccountLog(accountIdA, '', '', action, filterAction, value, currencyType, msg, status);
	}

	//không sử dụng hàm này bên ngoài
	static async pushAccountLog(
		accountIdA,
		accountIdB,
		bankId,
		action,
		filterAction,
		value,
		currencyType,
		msg,
		status
	) {
		const newDetail = {}; //description
		const theTimeTotal = new moment().utcOffset('+07:00');
		const newDate = moment(theTimeTotal).format('DD/MM/YYYY');
		const newTime = moment(theTimeTotal).format('HH:mm:ss');

		newDetail.accountIdA = accountIdA;
		newDetail.accountIdB = accountIdB;
		newDetail.action = action;
		newDetail.value = value;
		newDetail.currencyType = currencyType;
		newDetail.status = status;
		newDetail.message = typeof msg !== 'undefined' ? msg : '';
		newDetail.bankId = bankId;
		newDetail.date = newDate;
		newDetail.time = newTime;

		await account_log.create({
			accountIdA: accountIdA,
			accountIdB: accountIdB,
			status: status,
			action: filterAction,
			value: value,
			currencyType: currencyType,
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
			type: Sequelize.TEXT,
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
