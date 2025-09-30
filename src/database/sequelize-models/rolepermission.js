'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // RolePermission belongsTo Role
      RolePermission.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role'
      });

      // RolePermission belongsTo Permission
      RolePermission.belongsTo(models.Permission, {
        foreignKey: 'permissionId',
        as: 'permission'
      });
    }
  }
  RolePermission.init(
    {
      roleId: DataTypes.INTEGER,
      permissionId: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'RolePermission'
    }
  );
  return RolePermission;
};
