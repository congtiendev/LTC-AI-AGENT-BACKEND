// =====================================================
// MAIN CONFIGURATION INDEX
// =====================================================

const environment = require('./environment');
const database = require('./database');

module.exports = {
  ...environment,
  database: database.sequelize
};
