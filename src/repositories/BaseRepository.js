// src/repositories/BaseRepository.js
const logger = require('@/utils/logger');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      logger.error(`${this.constructor.name}.findById error:`, error);
      throw error;
    }
  }

  async findOne(options = {}) {
    try {
      return await this.model.findOne(options);
    } catch (error) {
      logger.error(`${this.constructor.name}.findOne error:`, error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      logger.error(`${this.constructor.name}.findAll error:`, error);
      throw error;
    }
  }

  async create(data, options = {}) {
    try {
      return await this.model.create(data, options);
    } catch (error) {
      logger.error(`${this.constructor.name}.create error:`, error);
      throw error;
    }
  }

  async update(id, data, options = {}) {
    try {
      const record = await this.findById(id);
      if (!record) return null;
      return await record.update(data, options);
    } catch (error) {
      logger.error(`${this.constructor.name}.update error:`, error);
      throw error;
    }
  }

  async delete(id, options = {}) {
    try {
      const record = await this.findById(id);
      if (!record) return false;
      await record.destroy(options);
      return true;
    } catch (error) {
      logger.error(`${this.constructor.name}.delete error:`, error);
      throw error;
    }
  }

  async count(options = {}) {
    try {
      return await this.model.count(options);
    } catch (error) {
      logger.error(`${this.constructor.name}.count error:`, error);
      throw error;
    }
  }

  async paginate(options = {}) {
    try {
      const { page = 1, limit = 20, ...findOptions } = options;
      const offset = (page - 1) * limit;

      const { count, rows } = await this.model.findAndCountAll({
        ...findOptions,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error(`${this.constructor.name}.paginate error:`, error);
      throw error;
    }
  }

  async bulkCreate(data, options = {}) {
    try {
      return await this.model.bulkCreate(data, {
        validate: true,
        ...options
      });
    } catch (error) {
      logger.error(`${this.constructor.name}.bulkCreate error:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
