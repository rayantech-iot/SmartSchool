const db = require('./db');
const { testConnection } = db;

module.exports = { sequelize: null, testConnection };
