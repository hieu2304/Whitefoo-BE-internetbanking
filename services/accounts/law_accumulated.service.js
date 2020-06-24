const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;

class law_accumulated extends Model {}

law_accumulated.init(
	{
		term: {
			type: Sequelize.STRING,
			allowNull: false
		},
		value: {
			type: Sequelize.FLOAT,
			allowNull: false
        },
        percent: {
			type: Sequelize.STRING,
			allowNull: false
        }
	},
	{
		sequelize: db,
		modelName: 'law_accumulated'
	}
);