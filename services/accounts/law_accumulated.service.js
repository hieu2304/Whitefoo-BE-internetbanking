const Sequelize = require('sequelize');
const db = require('../db');
const initConstant = require('../../constants/init.constants');
const Model = Sequelize.Model;

class law_accumulated extends Model {
	static async initBaseValueLaw_Accumulated() {
		//xóa dữ liệu cũ
		await law_accumulated.destroy({
			where: {},
			truncate: true
		});

		//thêm data chuẩn
		await law_accumulated.bulkCreate(initConstant.law_accumulatedBaseValue);
	}
}

law_accumulated.init(
	{
		term: {
			type: Sequelize.INTEGER, //number of months: example: 3 months -> 3, 12 months->12
			allowNull: false
		},
		interestMonth: {
			//lãi hàng tháng
			type: Sequelize.DECIMAL, //4.0% -> lưu lại là 0.004 ; 1.5% -> 0.015
			allowNull: false
		},
		interestQuarterYear: {
			//lãi hàng quý
			type: Sequelize.DECIMAL, //4.0% -> lưu lại là 0.004 ; 1.5% -> 0.015
			allowNull: false
		},
		interestTerm: {
			//lãi hàng nằm
			type: Sequelize.DECIMAL, //4.0% -> lưu lại là 0.004 ; 1.5% -> 0.015
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'law_accumulated'
	}
);

module.exports = law_accumulated;
