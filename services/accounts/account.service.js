const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const randomHelper = require('../../helpers/random.helper');
const account_accumulatedService = require('./account_accumulated.service');
const moment = require('moment');
const audit_log = require('../users/audit_log.service');
const exchange_currencyService = require('../currency/exchange_currency.service');

// https://github.com/MikeMcl/decimal.js/
const Decimal = require('decimal.js');

class account extends Model {
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
		if (foundAccount.accountType == '1') {
			const moreFields = await account_accumulatedService.getAccountAccumulatedById(result.accountId);

			result.term = moreFields.term;
			result.startTermDate = moreFields.startTermDate;
		}
		//dùng từ getter để được định dạng
		result.openedDate = foundAccount.openedDate;
		result.closedDate = foundAccount.closedDate;

		return result;
	}

	static async getAccountUsingExclude(accountId) {
		const foundAccount = await account.findOne({
			where: {
				accountId: accountId
			},
			attributes: {
				exclude: [ 'createdAt', 'updatedAt', 'closedDate', 'id' ]
			}
		});
		if (!foundAccount) return null;

		const result = foundAccount.dataValues;
		// 0: payment, 1: accumulated
		//nếu đây là TK TK, thì thêm fields của TK TK
		if (foundAccount.accountType == '1') {
			const moreFields = await account_accumulatedService.getAccountAccumulatedById(result.accountId);

			result.term = moreFields.dataValues.term;
			result.startTermDate = moreFields.startTermDate;
		}
		//dùng từ getter để được định dạng
		result.openedDate = foundAccount.openedDate;

		return result;
	}

	static async getAllAccountNoneExclude(_id) {
		const list = await account.findAll({
			where: {
				userId: _id
			}
		});

		return list;
	}
	static async getAllAccountUsingExclude(_id) {
		const list = await account.findAll({
			where: {
				userId: _id
			},
			attributes: {
				exclude: [ 'createdAt', 'updatedAt', 'closedDate', 'id' ]
			}
		});

		return list;
	}

	//hàm này cho user, sẽ ẩn 1 số thuộc tính bí mật/bảo mật
	static async getAllAccountReferenceByIdUsingExclude(_id) {
		const list = await account.getAllAccountUsingExclude(_id);
		const result = [];

		//kiểm tra từng account trong list, nếu có account tiết kiệm thì phải thêm trường
		for (var i = 0; i < list.length; i++) {
			result.push(list[i].dataValues);
			result[i].openedDate = list[i].openedDate;
			// 0: payment, 1: accumulated
			if (result[i].accountType == '1') {
				//lấy thêm trường term và startTermDate
				const moreFields = await account_accumulatedService.getAccountAccumulatedById(list[i].accountId);
				//set thêm term và startTermDate
				// cách 1: records.set('Name', 'test')
				// cách 2: records.Name = 'test'
				//không dùng .dataValues vì cần định dạng từ getter
				result[i].term = moreFields.term;
				result[i].startTermDate = moreFields.startTermDate;
			}
		}

		return result;
	}

	//hàm này cho nhân viên, không ẩn bất cứ gì
	static async getAllAccountReferenceByIdNoneExclude(_id) {
		const list = await account.getAllAccountNoneExclude(_id);
		const result = [];

		//kiểm tra từng account trong list, nếu có account tiết kiệm thì phải thêm trường
		for (var i = 0; i < list.length; i++) {
			result.push(list[i].dataValues);
			result[i].openedDate = list[i].openedDate;
			// 0: payment, 1: accumulated
			if (result[i].accountType == '1') {
				//lấy thêm trường term và startTermDate
				const moreFields = await account_accumulatedService.getAccountAccumulatedById(list[i].accountId);
				//set thêm term và startTermDate
				// cách 1: records.set('Name', 'test')
				// cách 2: records.Name = 'test'
				//không dùng .dataValues vì cần định dạng từ getter
				result[i].term = moreFields.term;
				result[i].startTermDate = moreFields.startTermDate;
			}
		}

		return result;
	}

	static async checkIfExistAccountId(_id) {
		const isExist = await account.findOne({
			where: {
				accountId: _id
			}
		});
		if (isExist) return true;
		return false;
	}

	static async getUniqueRandomAccountId() {
		var randomAccountId = randomHelper.getRandomNumber(15);
		while (await account.checkIfExistAccountId(randomAccountId)) {
			randomAccountId = randomHelper.getRandomNumber(15);
		}
		return randomAccountId;
	}

	static async createNewAccount(request, currentUser) {
		const userId = typeof request.userId !== 'undefined' ? request.userId : request.id;
		const accountType = typeof request.accountType !== 'undefined' ? request.accountType : request.type;
		const currencyType = typeof request.currencyType !== 'undefined' ? request.currencyType : request.currency;

		const newAccountId = await account.getUniqueRandomAccountId();

		//nếu tài khoản thanh toán thì chỉ thêm bảng account
		const newAccount = await account.create({
			accountId: newAccountId,
			userId: userId,
			status: '0',
			balance: 0,
			currencyType: currencyType,
			accountType: accountType,
			openedDate: moment()
		});

		// 0: payment, 1: accumulated
		if (accountType == '1') {
			//nếu tài khoản tiết kiệm, phải gọi và thêm vào account_accumulated
			const result_accumulated = await account_accumulatedService.createNewAccumulatedAccount(
				request,
				newAccountId
			);
		}

		//sau khi thêm xog thì push log
		if (newAccount) {
			await audit_log.pushAuditLog(
				currentUser.id,
				userId,
				'create account',
				'create account type ' + accountType
			);
		}

		//trả về STK và các thông tin cơ bản cho nhân viên thấy
		const result = await account.getAccountUsingExclude(newAccount.accountId);

		return result;
	}

	static async addBalanceForAccount(request, currentUser) {
		//lấy accountId
		const accountId = typeof request.accountId !== 'undefined' ? request.accountId : request.id;
		if (!accountId) return null;
		if (typeof request.currency === 'undefined') return null;
		if (request.currency !== 'VND' && request.currency !== 'USD') return null;
		//tìm kiếm account này
		const theChosenAccount = await account.findOne({
			where: {
				accountId: accountId
			}
		});
		if (!theChosenAccount) return null;

		//giá trị hiện tại và giá trị sẽ được thêm
		var newBalance = new Decimal(theChosenAccount.balance);
		var addBalance = new Decimal(request.balance);

		//kiểm tra đơn vị tiền tệ, quy đổi nếu khác nhau, rồi mới thêm
		//exchange_currencyService
		if (theChosenAccount.currencyType !== request.currency) {
			const newAddBalance = await exchange_currencyService.exchangeMoney(addBalance, request.currency);
			addBalance = new Decimal(newAddBalance);
		}
		console.log(newBalance);
		console.log(addBalance);
		newBalance = newBalance.plus(addBalance);
		console.log(newBalance);
		const result = await account.update(
			{
				balance: newBalance
			},
			{
				where: { accountId: accountId }
			}
		);
		if (result) {
			await audit_log.pushAuditLog(
				currentUser.id,
				theChosenAccount.userId,
				'add balance',
				'id: ' + accountId + ', add:' + request.balance + theChosenAccount.currencyType
			);
			return { result, newBalance };
		}
		return null;
	}

	static async updateAccount(request, currentUser){
		//lấy accountId ra
		const accountId = typeof request.accountId !== 'undefined' ? request.accountId : request.id;
		if (!accountId) return null

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
		else if (newStatus !== '1' && newStatus !== '0') newStatus = theChosenAccount.status;

		//kiểm tra tình trạng status update Openeday hoặc ClosedDay kiểm tra 2 tình trạng 1:Ok , 0:Closed
		var newCloseDay = theChosenAccount.dataValues.closedDate;
		var newOpenDay = theChosenAccount.dataValues.openedDate;
		if(newStatus !== '1' && newStatus !== '-1')
		{
			newCloseDay = moment();
		}
		else{
			newOpenDay=moment();
		}
		//kiểm tra currencytype
		var newCurrencyType=request.currency;
		if(!newCurrencyType) newCurrencyType = theChosenAccount.currencyType;
		var  newAddBalance = new Decimal(theChosenAccount.balance);
		//exchange_currencyService
		if (theChosenAccount.currencyType !== request.currency) {
			  newAddBalance = await exchange_currencyService.exchangeMoney(newAddBalance,theChosenAccount.currencyType);
		}

		//update thông tin accountId
		const result = await account.update(
			{
				status: newStatus,
				currencyType:newCurrencyType,
				addBalance:newAddBalance,
				closedDate:newCloseDay,
				openedDate:newOpenDay
			},
			{
				where: { accountId: accountId }
			}
		);
		// push xuống log
		if (result) {
			await audit_log.pushAuditLog(
				currentUser.id,
				theChosenAccount.userId,
				'update account',
				'id: ' + accountId + ', update:' 
			);
			return { result, newStatus };
		}
		return null;
	}
	static async updateDaysAndTermsPassedForAccumulated() {
		//lấy danh sách các tài khoản là tài khoản tiết kiệm
		//và đang tình trạng ok
		const list = await account.findAll({
			where: {
				accountType: '1', //accumulated
				status: '1' //OK
			}
		});

		//gọi hàm update daysPassed và TermPassed bên accumulated
		for (var i = 0; i < list.length; i++) {
			await account_accumulatedService.updateDaysAndTermsPassed(list[i].dataValues.accountId);
		}
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
			type: Sequelize.STRING,
			allowNull: false
		},
		status: {
			type: Sequelize.STRING, //1: OK, 0: closed, -1: locked
			allowNull: false,
			defaultValue: '1'
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
			type: Sequelize.STRING, // 0: payment, 1: accumulated
			allowNull: false
		},
		openedDate: {
			type: Sequelize.DATEONLY,
			//getter
			get() {
				const result = moment.utc(this.getDataValue('openedDate')).format('DD/MM/YYYY');
				return result;
			},
			allowNull: true
		},
		closedDate: {
			type: Sequelize.DATEONLY,
			//getter
			get() {
				const result = moment.utc(this.getDataValue('closedDate')).format('DD/MM/YYYY');
				return result;
			},
			allowNull: true
		}
	},
	{
		sequelize: db,
		modelName: 'account'
	}
);

module.exports = account;
