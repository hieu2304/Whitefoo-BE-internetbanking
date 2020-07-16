const Sequelize = require('sequelize');
const db = require('../db');
const initConstant = require('../../constants/init.constants');
const Model = Sequelize.Model;

class law_payment extends Model {
	static async getLawPayment() {
		const list = await law_payment.findAll({ order: [ [ 'id', 'ASC' ] ] });
		return list;
	}
	static async initBaseValueLaw_Payment() {
		//xóa dữ liệu cũ
		await law_payment.destroy({
			where: {},
			truncate: true
		});

		//thêm data chuẩn
		await law_payment.bulkCreate(initConstant.law_paymentBaseValue);
	}
}

law_payment.init(
	{
		unit: {
			type: Sequelize.STRING,
			allowNull: false
		},
		limit: {
			type: Sequelize.DECIMAL,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'law_payment'
	}
);

/*
id			unit			limit
1			transfer		200tr
2			day				500tr
3			month			10tỷ
*/

module.exports = law_payment;
