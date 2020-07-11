const Sequelize = require('sequelize');
const db = require('../db');
const initConstant = require('../../constants/init.constants');
const Model = Sequelize.Model;

class fee_payment extends Model {
	static async initBaseValueFee_Payment() {
		//xóa dữ liệu cũ
		await fee_payment.destroy({
			where: {},
			truncate: true
		});

		//thêm data chuẩn
		await fee_payment.bulkCreate(initConstant.fee_paymentBaseValue);
	}
}

fee_payment.init(
	{
		fee: {
			type: Sequelize.DECIMAL, //tiền phải trả
			allowNull: false
		},
		value: {
			type: Sequelize.DECIMAL, //mức tiền giao dịch để trả cái fee trên
			allowNull: false
		},
		transferType: {
			type: Sequelize.STRING, // 1 is transferring Internal Bank, 0 is transferring External Bank
			allowNull: false,
			defaultValue: '1'
		}
	},
	{
		sequelize: db,
		modelName: 'fee_payment'
	}
);

module.exports = fee_payment;

/* Example
id				fe					value				transferType
1				10000				300000				0
2				20000				300000				1
3				0.025(25%)			1000000				0

giải thích
id:1
khi chuyển tiền nội bộ từ 300k đổ xuống thì phí là 10000
*/
