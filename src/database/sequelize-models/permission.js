'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Permission belongsToMany Role through RolePermissions
      Permission.belongsToMany(models.Role, {
        through: models.RolePermission,
        foreignKey: 'permissionId',
        otherKey: 'roleId',
        as: 'roles'
      });

      // Permission hasMany RolePermissions
      Permission.hasMany(models.RolePermission, {
        foreignKey: 'permissionId',
        as: 'rolePermissions'
      });
    }
  }
  Permission.init(
    {
      name: DataTypes.STRING,
      displayName: DataTypes.STRING,
      description: DataTypes.TEXT,
      module: DataTypes.STRING,
      action: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'Permission'
    }
  );
  return Permission;
};
