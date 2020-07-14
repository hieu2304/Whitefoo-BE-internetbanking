const Sequelize = require('sequelize');
const db = require('../db');
const initConstant = require('../../constants/init.constants');
const Model = Sequelize.Model;
const Decimal = require('decimal.js');
class fee_payment extends Model {
	static async getTransferFee(value, transferType) {
		const list = await fee_payment.findAll({
			where: {
				transferType: transferType
			},
			order: [ [ 'id', 'ASC' ] ]
		});

		var count = 0;
		for (var i = 0; i < list.length; i++) {
			if (parseFloat(value) < parseFloat(list[i].value)) {
				count += 1;
			}
		}

		//công thức:
		//đếm số lần thấp hơn so với các mệnh giá tối đa các mức

		// nếu count = 5 -> mức phí 1
		// nếu count = 4 -> mức phí 2
		// nếu count = 3 -> mức phí 3
		// nếu count = 2 -> mức phí 4
		// nếu count = 1 hoặc 0 -> mức phí 5

		//ví dụ: giá trị là 400 000 (mức 1 : 20k <= X < 500k)
		//count sẽ là 5 -> phí là mức 1 (nội bộ 0đ, liên ngân hàng 7000đ)

		//ví dụ 2: giá trị là 10 000 000 (mức 3 : 10mil <= X <= 50mil)
		//count sẽ là 3 -> phí là mức 3 (nội bộ 0.05% x Giá trị, liên ngân hàng 0.2% x giá trị)

		//ví dụ 3: giá trị là 150 000 000 (mức 5 : X >= 150mil)
		//count sẽ là 1 -> phí mức 5 (nội bộ 0.1% x Giá Trị, liên ngân hàng 0.4% x Giá trị)

		var finalFee = new Decimal(0.0);

		if (count == 5) {
			finalFee = new Decimal(list[0].fee);
		} else if (count == 4) {
			finalFee = new Decimal(list[1].fee);
		} else if (count == 3) {
			finalFee = new Decimal(list[2].fee);
		} else if (count == 2) {
			finalFee = new Decimal(list[3].fee);
		} else {
			finalFee = new Decimal(list[4].fee);
		}

		//nếu là % thì tính ra phí rồi trả về
		if (parseFloat(finalFee) < 1.0) {
			finalFee = new Decimal(finalFee).mul(value);
		}

		return finalFee;
	}

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
