const BaseRepository = require('./BaseRepository');
const { PasswordResetToken } = require('@/database/models');
const logger = require('@/utils/logger');

class PasswordResetTokenRepository extends BaseRepository {
  constructor() {
    super(PasswordResetToken);
  }

  async findByToken(token) {
    try {
      return await this.model.findOne({ where: { token } });
    } catch (error) {
      logger.error('PasswordResetTokenRepository.findByToken error:', error);
      throw error;
    }
  }

  async deleteExpired() {
    try {
      const result = await this.model.destroy({
        where: {
          expiresAt: {
            [this.model.sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      });
      return result;
    } catch (error) {
      logger.error('PasswordResetTokenRepository.deleteExpired error:', error);
      throw error;
    }
  }
}

module.exports = new PasswordResetTokenRepository();
