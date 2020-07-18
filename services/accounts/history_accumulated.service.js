const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class history_accumulated extends Model {}

history_accumulated.init(
	{
		accountId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		time: {
			type: Sequelize.DATE,
			get: function() {
				return moment.utc(this.getDataValue('time')).format('DD/MM/YYYY hh:mm:ss');
			},
			allowNull: false
		},
		message: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		value: {
			type: Sequelize.DECIMAL,
			allowNull: false
		},
		status: {
			type: Sequelize.INTEGER, // 1 is OK, 0 is failed
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'history_accumulated'
	}
);

module.exports = history_accumulated;
