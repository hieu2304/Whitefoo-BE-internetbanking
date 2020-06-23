const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class account extends Model {}

account.init(
	{
		accountId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		userId: {
			type: Sequelize.INTEGER,
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
			type: Sequelize.DATE,
			allowNull: false
		},
		closedDate: {
			type: Sequelize.DATE,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'account'
	}
);
