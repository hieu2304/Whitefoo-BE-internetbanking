const Sequelize = require('sequelize');
const connectionString = process.env.DATABASE_URL;
const db = new Sequelize(connectionString);

module.exports = db;
