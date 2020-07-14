const Sequelize = require('sequelize');
const db = require('../db');
const User = require('../users/user.service');
const Model = Sequelize.Model;

class Storage extends Model {
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
            attributes: ['id', 'container', 'uuid', 'blobName', 'blobSize', 'quality', 'mimeType', 'userId'],
            where: {
                container,
                userId
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
Storage.init({
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
}, {
    sequelize: db,
    modelName: 'storage',
    freezeTableName: true
});

User.hasMany(Storage);
Storage.belongsTo(User);

module.exports = Storage;