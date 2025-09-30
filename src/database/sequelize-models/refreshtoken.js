'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // RefreshToken belongsTo User
      RefreshToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  RefreshToken.init(
    {
      userId: DataTypes.INTEGER,
      token: DataTypes.TEXT,
      expiresAt: DataTypes.DATE,
      revokedAt: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'RefreshToken'
    }
  );
  return RefreshToken;
};
