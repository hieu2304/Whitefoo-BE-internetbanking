const Sequelize = require('sequelize');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/whitefoo';
const db = new Sequelize(connectionString);

module.exports = db;
