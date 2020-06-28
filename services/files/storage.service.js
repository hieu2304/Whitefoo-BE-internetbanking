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
            attributes: ['id', 'container', 'blobName', 'blobSize', 'mimeType', 'userId'],
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
    blobName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    blobSize: {
        type: Sequelize.INTEGER,
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