const Sequelize = require('sequelize');
const connectionString = process.env.DATABASE_URL; // vào .env mà set, thằng hiếu đừng có set ở đây coi
const db = new Sequelize(connectionString);

module.exports = db;
