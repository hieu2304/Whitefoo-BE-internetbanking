const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class exchange_currency extends Model {}

exchange_currency.init(
	{
		unitA: {
			type: Sequelize.STRING,
			allowNull: false
		},
		unitB: {
			type: Sequelize.STRING,
			allowNull: false
		},
		rate: {
			//tỷ lệ chuyển đổi tiền tệ -> dùng khi nạp tiền cần chuyển đổi, hàm chuyển đổi sẽ cần
			type: Sequelize.DECIMAL
		},
		fee: {
			//phí khi chuyển đổi -> dùng khi chuyển khoản khác tiền tệ của 2 tài khoản, hàm chuyển khoản sẽ gọi
			type: Sequelize.DECIMAL,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'exchange_currency'
	}
);

module.exports = exchange_currency;

/* EXAMPLE
id				unitA				unitB				rate			fee
1				USD					VND					23211			0.005 (0.5%)
2				VND					USD					0,000043		0.005 (0.5%)
*/
