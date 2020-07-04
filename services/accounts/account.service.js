const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const randomHelper = require('../../helpers/random.helper');
const account_accumulatedService = require('./account_accumulated.service');
const moment = require('moment');
const audit_log = require('../users/audit_log.service');

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
}

account.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		userId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		status: {
			type: Sequelize.STRING, //0: OK, 1: closed, 2: locked
			allowNull: false,
			defaultValue: '1'
		},
		balance: {
			type: Sequelize.DECIMAL, //a large number, use Long int or double
			allowNull: false
		},
		currencyType: {
			type: Sequelize.STRING,
			allowNull: false
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
