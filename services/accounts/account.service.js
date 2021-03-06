const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const Op = Sequelize.Op;
const randomHelper = require('../../helpers/random.helper');
const account_accumulatedService = require('./account_accumulated.service');
var moment = require('moment');
moment().utcOffset('+07:00');
const exchange_currencyService = require('../currency/exchange_currency.service');
const errorListConstant = require('../../constants/errorsList.constant');
const whiteListService = require('../partner/whitelist.service');
const fee_paymentService = require('../accounts/fee_payment.service');

// https://github.com/MikeMcl/decimal.js/
const Decimal = require('decimal.js');

class account extends Model {
	//hàm lấy thông tin STK ra theo accountId
	static async getAccountNoneExclude(accountId) {
		const foundAccount = await account.findOne({
			where: {
				accountId: accountId
			}
		});
		if (!foundAccount) return null;

		const result = foundAccount.dataValues;
		// 0: payment, 1: accumulated
		//nếu đây là TK TK, thì thêm fields của TK TK
		if (foundAccount.accountType == 1) {
			const moreFields = await account_accumulatedService.getAccountAccumulatedById(result.accountId);

			result.term = moreFields.term;
			result.startTermDate = moreFields.startTermDate;
		}
		//dùng từ getter để được định dạng
		result.openedDate = foundAccount.openedDate;
		result.closedDate = foundAccount.closedDate;
		result.createdAt = moment(result.createdAt).format('DD/MM/YYYY HH:mm:ss');
		result.updatedAt = moment(result.updatedAt).format('DD/MM/YYYY HH:mm:ss');

		if (result.openedDate === 'Invalid date') result.openedDate = '';
		if (result.closedDate === 'Invalid date') result.closedDate = '';

		return result;
	}
	static async getAccountUsingExclude(accountId) {
		const foundAccount = await account.getAccountNoneExclude(accountId);

		if (foundAccount.createdAt) delete foundAccount.createdAt;
		if (foundAccount.updatedAt) delete foundAccount.updatedAt;

		return foundAccount;
	}

	//hàm lấy toàn bộ account của 1 user theo loại account
	static async getAccountListFilterByType(userId, type) {
		var accountType = [ 0 ];
		if (type == 1 || type == '1') accountType = [ 1 ];

		const result = await account.findAll({
			where: {
				userId: userId,
				accountType: accountType
			},
			attributes: {
				exclude: [ 'createdAt', 'updatedAt', 'id', 'accountType', 'openedDate', 'closedDate' ]
			}
		});

		return result;
	}

	//hàm chỉ trả ra list account trong array ['1234','456'...]
	static async getAccountIdArrayByUserId(userId) {
		const list = await account.findAll({
			where: {
				userId: userId
			},
			attributes: [ 'accountId' ]
		});
		const result = [];
		for (var i = 0; i < list.length; i++) {
			result.push(list[i].accountId);
		}
		return result;
	}

	//hàm lấy thông tin toàn bộ STK ra theo userId, có paging, có filter
	static async getAccountList(userId, request) {
		const keyword = typeof request.keyword !== 'undefined' ? request.keyword : '';
		var accountType = typeof request.type !== 'undefined' ? request.type : request.accountType;

		var accountTypeArr = [ 0, 1 ];
		if (accountType && (await account.isNumber(accountType))) {
			accountType = parseInt(accountType);
			if (accountType === 1) {
				accountTypeArr = [ 1 ];
			} else if (accountType === 0) {
				accountTypeArr = [ 0 ];
			}
		}

		var start = typeof request.start !== 'undefined' ? request.start : 0;
		var limit = typeof request.limit !== 'undefined' ? request.limit : 3;
		start = start * limit;

		const totalList = await account.findAndCountAll({
			where: {
				userId: parseInt(userId),
				accountType: accountTypeArr,
				[Op.or]: [
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('accountId')), {
						[Op.like]: '%' + keyword + '%'
					})
				]
			},
			attributes: {
				exclude: [ 'createdAt', 'updatedAt', 'id' ]
			},
			offset: Number(start),
			limit: Number(limit),
			order: [ [ 'id', 'ASC' ] ]
		});

		const list = [];
		for (var i = 0; i < totalList.rows.length; i++) {
			var temp = totalList.rows[i].dataValues;
			temp.openedDate = totalList.rows[i].openedDate;
			temp.closedDate = totalList.rows[i].closedDate;
			if (temp.closedDate == 'Invalid date') temp.closedDate = '';

			// 0: payment, 1: accumulated
			if (temp.accountType == 1) {
				//lấy thêm trường term và startTermDate
				const moreFields = await account_accumulatedService.getAccountAccumulatedById(temp.accountId);

				temp.term = moreFields.term;
				temp.startTermDate = moreFields.startTermDate;
			}
			list.push(temp);
		}

		const count = totalList.count;

		return { count, list };
	}

	//kiểm tra có phải số
	static isNumber(n) {
		return !isNaN(parseFloat(n)) && !isNaN(n - 0);
	}

	static async checkIfExistAccountId(accountId) {
		const isExist = await account.findOne({
			where: {
				accountId: accountId
			}
		});
		if (isExist) return true;
		return false;
	}

	//hàm hỗ trợ cho hàm tạo STK
	static async getUniqueRandomAccountId() {
		var randomAccountId = randomHelper.getRandomNumber(9);
		while (await account.checkIfExistAccountId(randomAccountId)) {
			randomAccountId = randomHelper.getRandomNumber(9);
		}
		return randomAccountId;
	}

	//tạo STK mới
	static async createNewAccount(request) {
		const ErrorsList = [];
		const createNewAccountErrors = errorListConstant.accountErrorsConstant;

		const userId = typeof request.userId !== 'undefined' ? request.userId : request.id;
		const accountType = typeof request.accountType !== 'undefined' ? request.accountType : request.type;
		const currencyType = typeof request.currencyType !== 'undefined' ? request.currencyType : request.currency;
		const newAccountId = await account.getUniqueRandomAccountId();
		const newBalance = typeof request.balance !== 'undefined' ? request.balance : 0;

		if (!await account.isNumber(newBalance)) {
			ErrorsList.push(createNewAccountErrors.MONEY_INVALID);
		}

		//Kiểm tra input lỗi
		//chỉ cho tạo 0 hoặc 1, 0 là payment, 1 là tiet kiem
		if (accountType !== '1' && accountType !== '0') {
			ErrorsList.push(createNewAccountErrors.INVALID_ACCOUNT_TYPE);
		}
		if (accountType === '1' && request.term !== '3' && request.term !== '6' && request.term !== '12') {
			//nếu là tài khoản tiết kiệm thì check term đúg ko

			if (request.term !== '18' && request.term !== '24' && request.term !== '30' && request.term !== '36') {
				ErrorsList.push(createNewAccountErrors.INVALID_TERM);
			}
		}

		//chỉ nhận USD hoặc VND
		if (currencyType !== 'USD' && currencyType !== 'VND') {
			ErrorsList.push(createNewAccountErrors.INVALID_CURRENCY);
		}

		//lúc tạo phải từ 500k VND trở lên
		if (currencyType === 'VND' && newBalance < 500000) {
			ErrorsList.push(createNewAccountErrors.TOO_LOW_BALANCE);
		} else if (currencyType === 'USD') {
			const VNDValue = await exchange_currencyService.exchangeMoney(newBalance, 'USD');
			if (VNDValue < 500000) ErrorsList.push(createNewAccountErrors.TOO_LOW_BALANCE);
		}

		if (ErrorsList.length > 0) return { result: null, ErrorsList };

		//nếu tài khoản thanh toán thì chỉ thêm bảng account
		const newAccount = await account.create({
			accountId: newAccountId,
			userId: userId,
			status: 1,
			balance: newBalance,
			currencyType: currencyType,
			accountType: accountType,
			openedDate: moment()
		});

		// 0: payment, 1: accumulated
		if (accountType == 1) {
			//nếu tài khoản tiết kiệm, phải gọi và thêm vào account_accumulated
			await account_accumulatedService.createNewAccumulatedAccount(request, newAccountId);
		}

		//trả về STK và các thông tin cơ bản cho nhân viên thấy
		const result = await account.getAccountUsingExclude(newAccount.accountId);
		return { result, ErrorsList };
	}

	//nạp tiền
	static async addBalanceForAccount(request) {
		const ErrorsList = [];
		const loadUpBalanceErrors = errorListConstant.accountErrorsConstant;

		//lấy accountId
		const accountId = typeof request.accountId !== 'undefined' ? request.accountId : request.id;

		if (request.currencyType !== 'VND' && request.currencyType !== 'USD') {
			ErrorsList.push(loadUpBalanceErrors.INVALID_CURRENCY);
		}
		//tìm kiếm account này
		const theChosenAccount = await account.findOne({
			where: {
				accountId: accountId
			}
		});
		if (!theChosenAccount) {
			ErrorsList.push(loadUpBalanceErrors.ACCOUNT_NOT_FOUND);
			return ErrorsList;
		}

		if (theChosenAccount.accountType === 1 && theChosenAccount.status === 1) {
			ErrorsList.push(loadUpBalanceErrors.ALREADY_STARTED_ACCUMULATED);
		}

		if (!await account.isNumber(request.balance) || !request.balance) {
			ErrorsList.push(loadUpBalanceErrors.MONEY_INVALID);
		} else if (request.balance && parseFloat(request.balance) < 0.0) {
			ErrorsList.push(loadUpBalanceErrors.MONEY_INVALID);
		}

		if (ErrorsList.length > 0) return ErrorsList;

		//giá trị hiện tại và giá trị sẽ được thêm
		var newBalance = new Decimal(theChosenAccount.balance);
		var addBalance = new Decimal(request.balance);

		//kiểm tra đơn vị tiền tệ, quy đổi nếu khác nhau, rồi mới thêm
		//exchange_currencyService
		if (theChosenAccount.currencyType !== request.currencyType) {
			const newAddBalance = await exchange_currencyService.exchangeMoney(addBalance, request.currencyType);
			addBalance = new Decimal(newAddBalance);
		}
		//console.log(newBalance);
		//console.log(addBalance);
		newBalance = newBalance.plus(addBalance);
		//console.log(newBalance);

		//nếu tài khoản đi bị khóa, update lại thành mở, update ngày đóng + mở lại
		if (theChosenAccount.status != 1) {
			await account.update(
				{
					status: 1,
					openedDate: new moment(),
					closedDate: null
				},
				{
					where: { accountId: accountId }
				}
			);
		}

		await account.update(
			{
				balance: newBalance
			},
			{
				where: { accountId: accountId }
			}
		);

		return null;
	}

	static async updateAccount(request) {
		//lấy accountId ra
		const accountId = typeof request.accountId !== 'undefined' ? request.accountId : request.id;
		if (!accountId) return null;

		//tìm kiếm accountId trong DB
		const theChosenAccount = await account.findOne({
			where: {
				accountId: accountId
			}
		});
		if (!theChosenAccount) return null;

		//kiểm tra tình trạng status chỉ nhận 2 dạng tình trạng tài khoản
		var newStatus = request.status;
		if (!newStatus) newStatus = theChosenAccount.status;
		else if (newStatus && newStatus != 1 && newStatus != 0) newStatus = theChosenAccount.status;

		//kiểm tra tình trạng status update openedDate hoặc closedDay kiểm tra 2 tình trạng 1:Ok , 0:Closed
		var newCloseDay = theChosenAccount.dataValues.closedDate;
		var newOpenDay = theChosenAccount.dataValues.openedDate;
		if (newStatus !== theChosenAccount.status) {
			if (newStatus == 1) {
				newCloseDay = null;
				newOpenDay = moment();
			} else if (newStatus == 0) {
				newCloseDay = moment();
			}
		}

		//kiểm tra currencytype
		var newCurrencyType = request.currency;
		if (!newCurrencyType) newCurrencyType = theChosenAccount.currencyType;

		var newBalance = new Decimal(theChosenAccount.balance);

		if (theChosenAccount.currencyType != newCurrencyType) {
			newBalance = await exchange_currencyService.exchangeMoney(
				theChosenAccount.balance,
				theChosenAccount.currencyType
			);
		}

		//update thông tin accountId
		var result = await account.update(
			{
				status: newStatus,
				currencyType: newCurrencyType,
				balance: newBalance,
				closedDate: newCloseDay,
				openedDate: newOpenDay
			},
			{
				where: { accountId: accountId }
			}
		);

		if (result) {
			return theChosenAccount;
		}
		return null;
	}

	//hàm rút tiền cho tài khoản thanh toán
	static async withdrawForPaymentAccount(foundAccount, value) {
		const newBalance = new Decimal(foundAccount.balance).sub(value);
		await account.update(
			{
				balance: newBalance
			},
			{
				where: {
					accountId: foundAccount.accountId
				}
			}
		);

		return newBalance;
	}
	//hàm rút tiền cho tài khoản tiết kiệm
	static async withdrawForAccumulatedAccount(foundAccount) {
		const profit = await account_accumulatedService.profitCalculate(foundAccount);
		profit.balance = foundAccount.balance;

		await account.update(
			{
				status: 0,
				balance: 0,
				closedDate: new moment()
			},
			{
				where: {
					accountId: foundAccount.accountId
				}
			}
		);

		//gọi để reset các giá trị lưu về ngày đã qua, kỳ hạn đã qua...
		await account_accumulatedService.withdrawResetAccumulated(foundAccount.accountId);

		return profit;
	}

	//hàm sẽ chạy mỗi ngày 1 lần cho các STK loại tiết kiệm đê + ngày
	static async updateDaysAndTermsPassedForAccumulated() {
		//lấy danh sách các tài khoản là tài khoản tiết kiệm
		//và đang tình trạng ok
		const list = await account.findAll({
			where: {
				accountType: 1, //accumulated
				status: 1 //OK,
			}
		});

		//gọi hàm update daysPassed và TermPassed bên accumulated
		for (var i = 0; i < list.length; i++) {
			await account_accumulatedService.updateDaysAndTermsPassed(list[i].dataValues.accountId);
		}
	}

	//hàm tính phí khi chuyển khoản (nhận usd -> trả USD, nhận VND -> trả VND)
	static async feeCalculateForPayment(accountId, money, transferType) {
		var transferTypeDefault = transferType || 1;
		var totalMoney = new Decimal(money);
		var fee = new Decimal(0.0);
		const foundAccount = await account.findOne({
			where: {
				accountId: accountId,
				accountType: 0 //0 is payment
			}
		});
		if (!foundAccount) return fee;

		//nếu tài khoản xài khác đơn vị VND thì chuyển sang VND để tính phí (bảng  phí theo VND)
		if (foundAccount.currencyType !== 'VND') {
			totalMoney = await exchange_currencyService.exchangeMoney(totalMoney, 'USD');
		}

		fee = await fee_paymentService.getTransferFee(totalMoney, transferTypeDefault);

		//nếu tài khoản xài khác đơn vị VND, thì cái phí trên là theo VND, chuyển về USD
		if (foundAccount.currencyType !== 'VND') {
			fee = await exchange_currencyService.exchangeMoney(fee, 'VND');
		}

		return fee;
	}

	//hàm tính tiền lãi, sẽ gọi thêm bên accumulated
	static async profitCalculateForAccumulated(request) {
		const foundAccount = await account.findOne({
			where: {
				accountId: request.accountId,
				accountType: 1 //1 is accumulated
			}
		});
		if (!foundAccount) return { profit: '0' };
		const result = await account_accumulatedService.profitCalculate(foundAccount);
		return result;
	}

	//hàm nhận tiền liên ngân hàng
	static async listenExternal_account(foundAccount, request) {
		const requestAccountId = request.requestAccountId;
		const bankId = request.bankId;
		const bankSecretKey = request.bankSecretKey;
		const money = request.money;
		const currency = request.currency;
		if (currency !== 'VND' && currency !== 'USD') return 2;
		if (!bankId || !bankSecretKey || !requestAccountId || !money) return 4;
		if (!this.isNumber(money)) return 4;
		const HomiesList = await whiteListService.checkIfInWhitelist(bankId, bankSecretKey);
		if (!HomiesList) return 1;
		//chỉ nhận bởi TK thanh toán
		if (foundAccount.accountType !== 0) return 3;

		var newMoney = new Decimal(money);
		if (foundAccount.currencyType !== currency) {
			newMoney = await exchange_currencyService.exchangeMoney(newMoney, currency);
		}
		//tới được đây là pass hết kiểm tra input, loại Tk...
		var newBalance = new Decimal(foundAccount.balance).plus(newMoney);

		await account.update(
			{
				balance: newBalance
			},
			{
				where: {
					accountId: request.accountId
				}
			}
		);
		return 0;
	}

	//backend only
	static async updateDaysOrTermPassedBackend(accountId, daysPassed, termsPassed) {
		const foundAccount = await account.getAccountNoneExclude(accountId);
		if (!foundAccount) return null;
		if (foundAccount.accountType != 1) return null;

		await account_accumulatedService.update(
			{
				daysPassed: daysPassed,
				termsPassed: termsPassed
			},
			{
				where: {
					accountId: accountId
				}
			}
		);
	}
}

account.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		userId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		status: {
			type: Sequelize.INTEGER, //1: OK, 0: closed, 2: locked
			allowNull: false,
			defaultValue: 1
		},
		balance: {
			type: Sequelize.DECIMAL, //a large number, use Long int or double
			allowNull: false
		},
		currencyType: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: 'VND'
		},
		accountType: {
			type: Sequelize.INTEGER, // 0: payment, 1: accumulated
			allowNull: false
		},
		openedDate: {
			type: Sequelize.DATEONLY,
			//getter
			get() {
				const result = moment(this.getDataValue('openedDate')).format('DD/MM/YYYY');
				return result;
			},
			allowNull: true
		},
		closedDate: {
			type: Sequelize.DATEONLY,
			//getter
			get() {
				const result = moment(this.getDataValue('closedDate')).format('DD/MM/YYYY');
				return result;
			},
			allowNull: true,
			defaultValue: null
		}
	},
	{
		sequelize: db,
		modelName: 'account'
	}
);

module.exports = account;
