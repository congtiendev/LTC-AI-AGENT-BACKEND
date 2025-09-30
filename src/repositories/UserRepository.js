// src/repositories/UserRepository.js
const BaseRepository = require('./BaseRepository');
const { User, Role } = require('@/database/models');
const logger = require('@/utils/logger');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    try {
      return await this.model.findOne({ where: { email } });
    } catch (error) {
      logger.error('UserRepository.findByEmail error:', error);
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      return await this.model.findOne({ where: { username } });
    } catch (error) {
      logger.error('UserRepository.findByUsername error:', error);
      throw error;
    }
  }

  async findByEmailOrUsername(identifier) {
    try {
      return await this.model.findOne({
        where: {
          [this.model.sequelize.Sequelize.Op.or]: [
            { email: identifier },
            { username: identifier }
          ]
        }
      });
    } catch (error) {
      logger.error('UserRepository.findByEmailOrUsername error:', error);
      throw error;
    }
  }

  async findByEmailUsernameOrPhone(account) {
    try {
      return await this.model.findOne({
        where: {
          [this.model.sequelize.Sequelize.Op.or]: [
            { email: account },
            { username: account },
            { phone: account }
          ]
        }
      });
    } catch (error) {
      logger.error('UserRepository.findByEmailUsernameOrPhone error:', error);
      throw error;
    }
  }

  async findByIdWithRoles(id) {
    try {
      return await this.model.findByPk(id, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          }
        ]
      });
    } catch (error) {
      logger.error('UserRepository.findByIdWithRoles error:', error);
      throw error;
    }
  }

  async createWithRole(userData, roleName = 'user') {
    const transaction = await this.model.sequelize.transaction();

    try {
      const user = await this.model.create(userData, { transaction });

      const role = await Role.findOne({ where: { name: roleName } });
      if (role) {
        await user.addRole(role, { transaction });
      }

      await transaction.commit();
      return await this.findByIdWithRoles(user.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('UserRepository.createWithRole error:', error);
      throw error;
    }
  }

  async updateLastLogin(id) {
    try {
      return await this.update(id, { lastLoginAt: new Date() });
    } catch (error) {
      logger.error('UserRepository.updateLastLogin error:', error);
      throw error;
    }
  }

  async exists(email, username) {
    try {
      const count = await this.model.count({
        where: {
          [this.model.sequelize.Sequelize.Op.or]: [{ email }, { username }]
        }
      });
      return count > 0;
    } catch (error) {
      logger.error('UserRepository.exists error:', error);
      throw error;
    }
  }

  async getUsersWithFilters(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        role = ''
      } = options;

      const where = {};
      const include = [];

      if (search) {
        where[this.model.sequelize.Sequelize.Op.or] = [
          {
            username: {
              [this.model.sequelize.Sequelize.Op.iLike]: `%${search}%`
            }
          },
          {
            email: { [this.model.sequelize.Sequelize.Op.iLike]: `%${search}%` }
          },
          {
            firstName: {
              [this.model.sequelize.Sequelize.Op.iLike]: `%${search}%`
            }
          },
          {
            lastName: {
              [this.model.sequelize.Sequelize.Op.iLike]: `%${search}%`
            }
          }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (role) {
        include.push({
          model: Role,
          as: 'roles',
          where: { name: role },
          through: { attributes: [] }
        });
      } else {
        include.push({
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        });
      }

      return await this.paginate({
        where,
        include,
        page,
        limit,
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      logger.error('UserRepository.getUsersWithFilters error:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();
