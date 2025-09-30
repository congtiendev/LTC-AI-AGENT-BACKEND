// src/database/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize } = require('@/config/database');
const basename = path.basename(__filename);
const db = {};

// Load all model files from sequelize-models directory
const modelsPath = path.join(__dirname, '../sequelize-models');

fs.readdirSync(modelsPath)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(modelsPath, file))(
      sequelize,
      sequelize.Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = sequelize.Sequelize;

module.exports = db;
