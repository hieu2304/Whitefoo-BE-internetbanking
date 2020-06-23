const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class history_accumulate extends Model {}

history_accumulate.init(
	{
		accountId: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		time: {
			type: Sequelize.DATE,
			allowNull: false
        },
        message: {
			type: Sequelize.STRING,
			allowNull: false
        },
        value: {
			type: Sequelize.STRING,
			allowNull: false
        },
        status: {
			type: Sequelize.STRING,
			allowNull: false
        },
	},
	{
		sequelize: db,
		modelName: 'history_accumulate'
	}
);
