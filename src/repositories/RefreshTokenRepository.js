// src/repositories/RefreshTokenRepository.js
const BaseRepository = require('./BaseRepository');
const { RefreshToken } = require('@/database/models');
const logger = require('@/utils/logger');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async findByToken(token) {
    try {
      return await this.model.findOne({ where: { token } });
    } catch (error) {
      logger.error('RefreshTokenRepository.findByToken error:', error);
      throw error;
    }
  }

  async createToken(userId, token, expiresAt) {
    try {
      return await this.create({
        userId,
        token,
        expiresAt,
        revokedAt: null
      });
    } catch (error) {
      logger.error('RefreshTokenRepository.createToken error:', error);
      throw error;
    }
  }

  async revokeToken(token) {
    try {
      const tokenRecord = await this.findByToken(token);
      if (!tokenRecord) return false;

      await tokenRecord.update({ revokedAt: new Date() });
      return true;
    } catch (error) {
      logger.error('RefreshTokenRepository.revokeToken error:', error);
      throw error;
    }
  }

  async revokeAllUserTokens(userId) {
    try {
      await this.model.update(
        { revokedAt: new Date() },
        {
          where: {
            userId,
            revokedAt: null
          }
        }
      );
      return true;
    } catch (error) {
      logger.error('RefreshTokenRepository.revokeAllUserTokens error:', error);
      throw error;
    }
  }

  async getUserActiveTokens(userId) {
    try {
      return await this.model.findAll({
        where: {
          userId,
          revokedAt: null,
          expiresAt: {
            [this.model.sequelize.Sequelize.Op.gt]: new Date()
          }
        },
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      logger.error('RefreshTokenRepository.getUserActiveTokens error:', error);
      throw error;
    }
  }

  async cleanExpiredTokens() {
    try {
      const result = await this.model.destroy({
        where: {
          [this.model.sequelize.Sequelize.Op.or]: [
            {
              expiresAt: {
                [this.model.sequelize.Sequelize.Op.lt]: new Date()
              }
            },
            {
              revokedAt: {
                [this.model.sequelize.Sequelize.Op.not]: null
              }
            }
          ]
        }
      });
      return result;
    } catch (error) {
      logger.error('RefreshTokenRepository.cleanExpiredTokens error:', error);
      throw error;
    }
  }

  async isTokenValid(token) {
    try {
      const tokenRecord = await this.findByToken(token);

      if (!tokenRecord) return false;
      if (tokenRecord.revokedAt) return false;
      if (new Date() >= new Date(tokenRecord.expiresAt)) return false;

      return true;
    } catch (error) {
      logger.error('RefreshTokenRepository.isTokenValid error:', error);
      return false;
    }
  }
}

module.exports = new RefreshTokenRepository();
