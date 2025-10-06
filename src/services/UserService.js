/**
 * src/services/UserService.js
 *
 * Consolidated service for user-related operations. Provides methods for
 * listing, fetching, updating, deleting users and password management.
 */
const UserRepository = require('@/repositories/UserRepository');
const { hashPassword, comparePassword } = require('@/utils/passwordUtils');
const logger = require('@/utils/logger');

/**
 * UserService class
 */
class UserService {
  /**
   * List users with pagination and filters.
   * @param {Object} options
   * @returns {Promise<Object>} { data: [], pagination: {} }
   */
  async listUsers(options = {}) {
    try {
      const result = await UserRepository.getUsersWithFilters(options);
      return {
        data: result.data.map(u => this.sanitizeUser(u)),
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('UserService.listUsers error:', error);
      throw error;
    }
  }

  /**
   * Get user by id (with roles) and sanitize output.
   * @param {number} userId
   * @returns {Promise<Object>} sanitized user
   */
  async getUserById(userId) {
    try {
      const user = await UserRepository.findByIdWithRoles(userId);
      if (!user) throw new Error('USER_NOT_FOUND');
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('UserService.getUserById error:', error);
      throw error;
    }
  }

  /**
   * Update user (partial). Prevents updating sensitive fields like email/status.
   * @param {number} userId
   * @param {Object} data
   * @returns {Promise<Object>} updated sanitized user
   */
  async updateUser(userId, data) {
    try {
      // Prevent updating certain fields
      delete data.email;
      delete data.status;
      if (data.password) delete data.password; // use changePassword

      const updated = await UserRepository.update(userId, data);
      if (!updated) throw new Error('USER_NOT_FOUND');
      return this.sanitizeUser(updated);
    } catch (error) {
      logger.error('UserService.updateUser error:', error);
      throw error;
    }
  }

  /**
   * Update profile for the authenticated user (no email/status/password updates).
   * @param {number} userId
   * @param {Object} data
   * @returns {Promise<Object>} updated sanitized user
   */
  async updateProfile(userId, data) {
    return this.updateUser(userId, data);
  }

  /**
   * Change user's password after validating current password.
   * @param {number} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) throw new Error('USER_NOT_FOUND');

      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) throw new Error('INVALID_PASSWORD');

      const hashed = await hashPassword(newPassword);
      await UserRepository.update(userId, { password: hashed });
      logger.info(`Password changed for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('UserService.changePassword error:', error);
      throw error;
    }
  }

  /**
   * Delete a user by id.
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async deleteUser(userId) {
    try {
      const deleted = await UserRepository.delete(userId);
      if (!deleted) throw new Error('USER_NOT_FOUND');
      logger.info(`User deleted: ${userId}`);
      return true;
    } catch (error) {
      logger.error('UserService.deleteUser error:', error);
      throw error;
    }
  }

  /**
   * Remove sensitive fields before returning user object.
   * @param {Object} user
   * @returns {Object}
   */
  sanitizeUser(user) {
    const u = user.toJSON ? user.toJSON() : user;
    delete u.password;
    return u;
  }
}

module.exports = new UserService();
