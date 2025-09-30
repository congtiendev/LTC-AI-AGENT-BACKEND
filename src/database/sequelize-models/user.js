'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User belongsToMany Role through UserRoles
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'roles'
      });

      // User hasMany UserRoles
      User.hasMany(models.UserRole, {
        foreignKey: 'userId',
        as: 'userRoles'
      });

      // User hasMany RefreshTokens
      User.hasMany(models.RefreshToken, {
        foreignKey: 'userId',
        as: 'refreshTokens'
      });
    }
  }
  User.init(
    {
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      phone: DataTypes.STRING,
      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        comment: 'Avatar image path or URL'
      },
      status: DataTypes.STRING,
      emailVerified: DataTypes.BOOLEAN,
      emailVerifiedAt: DataTypes.DATE,
      lastLoginAt: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'User'
    }
  );
  return User;
};
