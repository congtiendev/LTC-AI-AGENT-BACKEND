'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Role belongsToMany User through UserRoles
      Role.belongsToMany(models.User, {
        through: models.UserRole,
        foreignKey: 'roleId',
        otherKey: 'userId',
        as: 'users'
      });

      // Role belongsToMany Permission through RolePermissions
      Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        as: 'permissions'
      });

      // Role hasMany UserRoles
      Role.hasMany(models.UserRole, {
        foreignKey: 'roleId',
        as: 'userRoles'
      });

      // Role hasMany RolePermissions
      Role.hasMany(models.RolePermission, {
        foreignKey: 'roleId',
        as: 'rolePermissions'
      });
    }
  }
  Role.init(
    {
      name: DataTypes.STRING,
      displayName: DataTypes.STRING,
      description: DataTypes.TEXT,
      level: DataTypes.INTEGER,
      isActive: DataTypes.BOOLEAN
    },
    {
      sequelize,
      modelName: 'Role'
    }
  );
  return Role;
};
