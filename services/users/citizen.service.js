const Sequelize = require('sequelize');
const db = require('../db');
const Model = Sequelize.Model;
const moment = require('moment');

class citizen extends Model {
	static async findCitizenByCitizenId(citizenIdentificationId) {
		return citizen.findOne({
			where: {
				citizenIdentificationId
			}
		});
	}

	static async createOrUpdateCitizen(
		citizenIdentificationId,
		identificationType,
		issueDateUnformatted,
		newCitizenIdentificationId
	) {
		var issueDateFormatted = moment(issueDateUnformatted, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss');
		if (issueDateFormatted == 'Invalid date') {
			issueDateFormatted = moment();
		}

		const foundCitizen = await citizen.findOne({
			where: {
				citizenIdentificationId
			}
		});

		//create
		if (!foundCitizen) {
			await citizen.create({
				citizenIdentificationId,
				identificationType,
				issueDate: issueDateFormatted
			});
		} else {
			//update
			await citizen.update(
				{
					citizenIdentificationId,
					identificationType,
					issueDate: issueDateFormatted,
					citizenIdentificationId: newCitizenIdentificationId
				},
				{
					where: {
						id: foundCitizen.id
					}
				}
			);
		}
	}
}
citizen.init(
	{
		citizenIdentificationId: {
			type: Sequelize.STRING,
			allowNull: false
		},
		identificationType: {
			//CMND hoặc CCCD
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: 'CMND'
		},
		issueDate: {
			type: Sequelize.DATEONLY,
			allowNull: false,
			get: function() {
				return moment.utc(this.getDataValue('issueDate')).format('DD/MM/YYYY');
			}
		}
	},
	{
		sequelize: db,
		modelName: 'citizen'
	}
);

module.exports = citizen;
