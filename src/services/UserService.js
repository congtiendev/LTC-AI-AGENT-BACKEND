// src/services/UserService.js
const UserRepository = require('@/repositories/UserRepository');
const { hashPassword } = require('@/utils/passwordUtils');
const logger = require('@/utils/logger');

class UserService {
  async getUserById(userId) {
    try {
      const user = await UserRepository.findByIdWithRoles(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('UserService.getUserById error:', error);
      throw error;
    }
  }

  async getUsers(filters = {}) {
    try {
      const result = await UserRepository.getUsersWithFilters(filters);

      return {
        data: result.data.map(user => this.sanitizeUser(user)),
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('UserService.getUsers error:', error);
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      delete updateData.password;
      delete updateData.email;
      delete updateData.status;

      const user = await UserRepository.update(userId, updateData);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      logger.info(`User profile updated: ${userId}`);
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('UserService.updateProfile error:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const { comparePassword } = require('@/utils/passwordUtils');
      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        throw new Error('INVALID_PASSWORD');
      }

      const hashedPassword = await hashPassword(newPassword);
      await UserRepository.update(userId, { password: hashedPassword });

      logger.info(`Password changed for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('UserService.changePassword error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const deleted = await UserRepository.delete(userId);
      if (!deleted) {
        throw new Error('USER_NOT_FOUND');
      }

      logger.info(`User deleted: ${userId}`);
      return true;
    } catch (error) {
      logger.error('UserService.deleteUser error:', error);
      throw error;
    }
  }

  sanitizeUser(user) {
    const userObj = user.toJSON ? user.toJSON() : user;
    delete userObj.password;
    return userObj;
  }
}

module.exports = new UserService();
