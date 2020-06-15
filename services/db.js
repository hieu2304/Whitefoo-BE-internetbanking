const Sequelize = require('sequelize');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/whitefoo';
const db = new Sequelize(connectionString);

module.exports = db;
