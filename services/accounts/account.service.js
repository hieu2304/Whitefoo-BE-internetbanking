const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class account extends Model {}

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
        balance: {
			type: Sequelize.STRING,
			allowNull: false
        },
        currencyType: {
			type: Sequelize.STRING,
			allowNull: false
        },
        accountType: {
			type: Sequelize.STRING,
			allowNull: false
        },
        openedDate: {
			type: Sequelize.DATEONLY,
			allowNull: false
		},
		closedDate: {
			type: Sequelize.DATEONLY,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'account'
	}
);
