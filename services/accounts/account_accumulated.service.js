const Sequelize = require('sequelize');
const db = require('../db');
const moment = require('moment');
const Model = Sequelize.Model;
const law_accumulatedService = require('../accounts/law_accumulated.service');
// https://github.com/MikeMcl/decimal.js/
const Decimal = require('decimal.js');

class account_accumulated extends Model {
	//hàm hỗ trợ khi bên accountService getAccount loại STK là TKTK
	static async getAccountAccumulatedById(accountId) {
		const result = await account_accumulated.findOne({
			where: {
				accountId: accountId
			}
		});

		return result;
	}

	//hàm nãy được gọi bên accountService khi ở bển tạo STK mới là TKTK
	static async createNewAccumulatedAccount(request, newAccountId) {
		const result = await account_accumulated.create({
			accountId: newAccountId,
			term: request.term,
			startTermDate: moment()
		});
		return result;
	}

	//hàm này sẽ được gọi mỗi ngày 1 lần bên accountService:
	// - để update ngày đã qua, kỳ hạn đã qua...
	// - chỉ update kỳ hạn khi và chỉ khi đạt số ngày kỳ hạn
	static async updateDaysAndTermsPassed(accountId) {
		const found = await account_accumulated.findOne({
			where: {
				accountId: accountId
			}
		});

		//ko tìm thấy hoặc ko nằm trong loại TK tiết kiệm sẽ ko tính ngày
		if (!found) return false;

		//những tài khoản khi đã đạt 1 kỳ hạn, sẽ vào trạng thái chờ rút, ko tính ngày nữa
		if (parseInt(found.termsPassed) > 0) return false;

		var currentDaysPassed = parseInt(found.daysPassed);
		var currentTermsPassed = parseInt(found.termsPassed);

		//nếu đã qua đúng kỳ hạn 1 ngày mà chưa rút thì update termsPassed
		//và set daysPassed = 0 (vì bên dưới +1 nên TH này -1 trước)
		if (await account_accumulated.checkIfAccountPassedTerm(found.term, currentDaysPassed + 1)) {
			const newFound = await account_accumulated.updateTermsPassed(accountId, currentTermsPassed);
			currentDaysPassed = parseInt(newFound.daysPassed) - 1; //thường = 0 -1
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
	//chỉ gọi khi 1 tài khoản đạt 1 kỳ hạn, hỗ trợ hàm updateDaysAndTermsPassed
	static async updateTermsPassed(accountId, termsPassed) {
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
	//kiểm tra STK đã đạt qua kỳ hạn chưa, hỗ trợ hàm updateDaysAndTermsPassed
	static checkIfAccountPassedTerm(term, daysPassed) {
		//1 tháng 30 ngày
		//1 quý 90 ngày
		//1 năm 360 ngày
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

	//hàm tính lãi, truyền vào 1 foundAccount
	static async profitCalculate(account) {
		const result = await account_accumulated.findOne({
			where: {
				accountId: account.accountId
			}
		});

		if (!result) return null;

		const allInterest = await law_accumulatedService.getInterestByTerm(result.term);
		if (!allInterest) return null;

		//lãi sẽ trả ra
		var profit = new Decimal(account.balance);

		//các thông số để tính toán
		var daysPassed = result.daysPassed;
		var quarterYearPassed = await account_accumulated.quarterYearPassedCalculate(daysPassed);
		const termsPassed = result.termsPassed;
		const term = result.term; //kỳ hạn tài khoản này đăg ký

		//TH1: đủ kỳ hạn
		if (termsPassed > 0) {
			// (0.05/360)*số kỳ hạn*360*vốn
			profit = new Decimal(profit).mul(allInterest.interestTerm);
		} else if (termsPassed === 0 && quarterYearPassed > 0 && term > 3) {
			//TH2: kỳ hạn đăng ký ko phải 3 tháng và đã qua 1 quý
			//(((%lãiQuý/360)* Số quý *90) + ((%lãiTháng/360)*số ngày))*vốn

			//tính lại ngày vì phải trừ quý ra = tổng ngày qua - (số quý qua*90)
			daysPassed = daysPassed - quarterYearPassed * 90;

			// (%lãiQuý/360)*số quý*90
			const quarterInterest = new Decimal(allInterest.interestQuarterYear).div(360);
			const profit_1 = new Decimal(quarterYearPassed * 90).mul(quarterInterest);

			// (%lãiTháng/360)*số ngày
			const monthInterest = new Decimal(allInterest.interestMonth).div(360);
			const profit_2 = new Decimal(daysPassed).mul(monthInterest);

			//(tỷ lãi 1 + tỷ lãi 2) * vốn
			const totalInterest = new Decimal(profit_1).plus(profit_2);
			profit = new Decimal(profit).mul(totalInterest);
		} else {
			//TH3: chưa tới quý hoặc chưa tới kỳ hạn

			// (%lãiTháng/360)*số ngày*vốn
			const monthInterest = new Decimal(allInterest.interestMonth).div(360);
			profit = new Decimal(profit).mul(daysPassed);
			profit = new Decimal(profit).mul(monthInterest);
		}

		const totalDaysPassed = term * termsPassed * 30 + quarterYearPassed * 90 + daysPassed;

		return {
			accountId: result.accountId,
			term,
			daysPassed,
			quarterYearPassed,
			termsPassed,
			totalDaysPassed,
			profit
		};
	}
	//hàm hỗ trợ cho hàm tính lãi: đếm Quý dựa vào ngày truyền vào
	static async quarterYearPassedCalculate(daysPassed) {
		var result = 0;
		if (daysPassed < 90) return 0;
		while (daysPassed > 89) {
			result += 1;
			daysPassed -= 90;
		}

		return result;
	}

	//hàm reset chỉ số, hỗ trợ cho rút tiền bên accountService,
	static async withdrawResetAccumulated(accountId) {
		await account_accumulated.update(
			{
				daysPassed: 0,
				termsPassed: 0
			},
			{
				where: {
					accountId: accountId
				}
			}
		);
	}
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
