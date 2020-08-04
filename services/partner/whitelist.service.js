const Sequelize = require('sequelize');
const db = require('../db');
const initConstant = require('../../constants/init.constants');
const Model = Sequelize.Model;

class whitelist extends Model {
	static async getWhiteListExclude() {
		const listTotal = await whitelist.findAndCountAll();
		const list = [];
		for (var i = 0; i < listTotal.rows.length; i++) {
			var temp = listTotal.rows[i].dataValues;
			delete temp.bankSecretKey;
			delete temp.URL;
			delete temp.clientId;
			delete temp.secretKey;
			delete temp.createdAt;
			delete temp.updatedAt;

			list.push(temp);
		}

		return { count: listTotal.count, list };
	}

	static async getWhitelist() {
		const result = await whitelist.findAll();
		return result;
	}

	static async checkIfInWhitelist(checkBankId, checkBankSecretKey) {
		const result = await whitelist.findOne({
			where: {
				bankId: checkBankId,
				bankSecretKey: checkBankSecretKey
			}
		});

		//khi bên ngân hàng đối tác request sang API chúng ta
		//chúng ta kiểm tra nếu nằm trong bảng whitelist
		if (result) return result;
		return null;
	}

	static async initBaseValueWhitelist() {
		//xóa dữ liệu cũ
		await whitelist.destroy({
			where: {},
			truncate: true
		});

		//thêm data chuẩn
		await whitelist.bulkCreate(initConstant.whitelistBaseValue);
	}
}

whitelist.init(
	{
		bankId: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		bankSecretKey: {
			type: Sequelize.STRING,
			allowNull: false
		},
		bankFullName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		URL: {
			type: Sequelize.TEXT,
			allowNull: false
		},

		//some bank does not need these 2 keys
		clientId: {
			type: Sequelize.STRING,
			allowNull: true
		},
		secretKey: {
			type: Sequelize.STRING,
			allowNull: true
		}
	},
	{
		sequelize: db,
		modelName: 'whitelist'
	}
);

module.exports = whitelist;
