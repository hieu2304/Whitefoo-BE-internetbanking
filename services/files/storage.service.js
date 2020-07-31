const Sequelize = require('sequelize');
const db = require('../db');
const User = require('../users/user.service');
const errorListConstant = require('../../constants/errorsList.constant');
const Model = Sequelize.Model;
const citizenService = require('../users/citizen.service');

class Storage extends Model {
	//user tự update CMND và chờ duyệt
	static async updateIdCard(request, currentUser) {
		const ErrorsList = [];
		const updateIdCardErrors = errorListConstant.userErrorsConstant;

		const foundUser = await User.findUserByPKNoneExclude(currentUser.id);
		if (!foundUser) {
			ErrorsList.push(updateIdCardErrors.USER_NOT_FOUND);
			return ErrorsList;
		}
		if (foundUser.approveStatus === 2) {
			ErrorsList.push(updateIdCardErrors.PENDING);
			return ErrorsList;
		}
		var newApproveStatus = 1; //mặc định là 1
		var newCitizenIdentificationId = request.citizenIdentificationId;

		//nếu là người dùng bình thường
		if (foundUser.userType == 1) {
			newApproveStatus = 2;

			////nếu chưa upload ảnh thì trả về lỗi
			// const checkUpload = await Storage.checkUserUploadIdCard(foundUser.id);
			// if (!checkUpload) {
			// 	ErrorsList.push(updateIdCardErrors.USER_NOT_UPLOAD_ID);
			// 	return ErrorsList;
			// }
		}

		if (newCitizenIdentificationId && newCitizenIdentificationId != foundUser.citizenIdentificationId) {
			//Kiểm tra CMND trùng
			var isConflict = await User.checkConflictCitizenIdentificationId(newCitizenIdentificationId);
			if (isConflict) {
				ErrorsList.push(updateIdCardErrors.CITIZENIDENTIFICATIONID_CONFLICT);
				return ErrorsList;
			}

			await User.update(
				{
					citizenIdentificationId: newCitizenIdentificationId,
					approveStatus: newApproveStatus
				},
				{
					where: {
						id: foundUser.id
					}
				}
			);

			await citizenService.createOrUpdateCitizen(
				newCitizenIdentificationId,
				request.identificationType,
				request.issueDate,
				newCitizenIdentificationId
			);
		}

		return null;
	}

	static async checkUserUploadIdCard(userId) {
		return Storage.findOne({
			where: {
				userId: userId,
				container: 'idcards',
				quality: 'original'
			}
		});
	}

	static async removeById(id) {
		return Storage.destroy({
			where: {
				id
			}
		});
	}

	static async removeByUserId(userId) {
		return Storage.destroy({
			where: {
				userId
			}
		});
	}

	static async findAllBlobsByUserId(container, userId) {
		return Storage.findAll({
			attributes: [ 'id', 'container', 'uuid', 'blobName', 'blobSize', 'quality', 'mimeType', 'userId' ],
			where: {
				container,
				userId
			}
		});
	}

	static async findQualityBlobsByUserId(container, userId, quality) {
		return Storage.findAll({
			attributes: [ 'id', 'container', 'uuid', 'blobName', 'blobSize', 'quality', 'mimeType', 'userId' ],
			where: {
				container,
				userId,
				quality
			}
		});
	}

	static async findOneBlob(container, id) {
		return Storage.findOne({
			where: {
				id,
				container
			}
		});
	}

	static async findOneBlobByUserId(container, userId) {
		return Storage.findOne({
			where: {
				container,
				userId
			}
		});
	}

	static async countBlobByUserId(container, userId) {
		return Storage.count({
			where: {
				container,
				userId
			}
		});
	}
}

//init here
Storage.init(
	{
		container: {
			type: Sequelize.STRING,
			allowNull: false
		},
		uuid: {
			type: Sequelize.STRING,
			allowNull: false
		},
		blobName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		blobSize: {
			type: Sequelize.INTEGER,
			allowNull: false
		},
		quality: {
			type: Sequelize.STRING,
			allowNull: false
		},
		mimeType: {
			type: Sequelize.STRING,
			allowNull: false
		}
	},
	{
		sequelize: db,
		modelName: 'storage',
		freezeTableName: true
	}
);

User.hasMany(Storage);
Storage.belongsTo(User);

module.exports = Storage;
