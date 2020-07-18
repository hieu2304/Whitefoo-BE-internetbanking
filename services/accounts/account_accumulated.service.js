const Sequelize = require('sequelize');
const db = require('../db');
const moment = require('moment');
const Model = Sequelize.Model;
const law_accumulatedService = require('../accounts/law_accumulated.service');

class account_accumulated extends Model {
	static async getAccountAccumulatedById(accountId) {
		const result = await account_accumulated.findOne({
			where: {
				accountId: accountId
			}
		});

		return result;
	}

	static async createNewAccumulatedAccount(request, newAccountId) {
		const result = await account_accumulated.create({
			accountId: newAccountId,
			term: request.term,
			startTermDate: moment()
		});
		return result;
	}

	//hàm update daysPassed và termsPassed
	static async updateDaysAndTermsPassed(accountId) {
		const found = await account_accumulated.findOne({
			where: {
				accountId: accountId
			}
		});

		if (!found) return false;
		if (parseInt(found.termsPassed) > 0) return false;

		var currentDaysPassed = parseInt(found.daysPassed);
		var currentTermsPassed = parseInt(found.termsPassed);

		//nếu đã qua đúng kỳ hạn 1 ngày mà chưa rút thì update termsPassed
		if (await account_accumulated.checkIfAccountPassedTerm(found.term, currentDaysPassed)) {
			const newFound = await account_accumulated.updateTermPassed(accountId, currentTermsPassed);
			currentDaysPassed = parseInt(newFound.daysPassed); //thường = 0
			currentTermsPassed = parseInt(newFound.termsPassed); // thường  > 0
		}

		//update daysPassed
		await account_accumulated.update(
			{
				daysPassed: currentDaysPassed + 1
			},
			{
				where: { accountId: accountId }
			}
		);

		return true;
	}

	static async updateTermPassed(accountId, termsPassed) {
		await account_accumulated.update(
			{
				daysPassed: 0,
				termsPassed: termsPassed + 1
			},
			{
				where: { accountId: accountId }
			}
		);

		const result = await account_accumulated.findOne({
			where: {
				accountId: accountId
			}
		});

		return result;
	}

	static checkIfAccountPassedTerm(term, daysPassed) {
		if (term == 3) {
			if (daysPassed == 90) return true;
			return false;
		} else if (term == 6) {
			if (daysPassed == 180) return true;
			return false;
		} else if (term == 12) {
			if (daysPassed == 360) return true;
			return false;
		} else if (term == 18) {
			if (daysPassed == 540) return true;
			return false;
		} else if (term == 24) {
			if (daysPassed == 720) return true;
			return false;
		} else if (term == 30) {
			if (daysPassed == 900) return true;
			return false;
		} else if (term == 36) {
			if (daysPassed == 1080) return true;
			return false;
		}
		return false;
	}

	//các hàm tính lãi
}

account_accumulated.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		term: {
			type: Sequelize.INTEGER, //number of months: example: 3 months -> 3, 12 months->12
			allowNull: false,
			defaultValue: 3
		},
		startTermDate: {
			type: Sequelize.DATEONLY,
			get: function() {
				return moment.utc(this.getDataValue('startTermDate')).format('DD/MM/YYYY');
			},
			allowNull: false
		},

		//đếm số ngày đã qua để khi rút tiền để tính toán tiền lãi
		daysPassed: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0
		},

		//đếm số kỳ hạn đã qua, nếu 1 người nào ko rút sau 1 kỳ hạn trôi qua
		//thì tiền lãi sẽ được tính vào vốn ở kỳ hạn tiếp theo
		termsPassed: {
			type: Sequelize.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	},
	{
		sequelize: db,
		modelName: 'account_accumulated'
	}
);

module.exports = account_accumulated;
