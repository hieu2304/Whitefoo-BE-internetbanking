const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class fee_payment extends Model {}

fee_payment.init(
	{
		fee: {
			type: Sequelize.DOUBLE, //tiền phải trả
			allowNull: false
		},
		value: {
			type: Sequelize.DOUBLE, //mức tiền giao dịch để trả cái fee trên
			allowNull: false
		},
		transferType: {
			type: Sequelize.STRING, // 0 is transferring Internal Bank, 1 is transferring External Bank
			allowNull: false,
			defaultValue: '0'
		}
	},
	{
		sequelize: db,
		modelName: 'fee_payment'
	}
);

/* Example
id				fe					value				transferType
1				10000				300000				0
2				20000				300000				1
3				15000				1000000				0

giải thích
id:1
khi chuyển tiền nội bộ từ 300k đổ xuống thì phí là 10000
*/
