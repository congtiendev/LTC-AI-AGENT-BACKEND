// src/services/AuthService.js
const UserRepository = require('@/repositories/UserRepository');
const RefreshTokenRepository = require('@/repositories/RefreshTokenRepository');
const { hashPassword, comparePassword } = require('@/utils/passwordUtils');
const { generateTokens, verifyRefreshToken } = require('@/utils/tokenUtils');
const logger = require('@/utils/logger');

/**
 * Service layer responsible for authentication business logic.
 * Handles registration, login, token refresh and logout flows.
 * @class AuthService
 */
class AuthService {
  /**
   * Register a new user and create initial tokens.
   * @param {Object} userData
   * @param {string} userData.username
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {string} [userData.firstName]
   * @param {string} [userData.lastName]
   * @param {string} [userData.phone]
   * @returns {Promise<Object>} Created user data and tokens
   */
  async register(userData) {
    try {
      const { username, email, password, firstName, lastName, phone } =
        userData;

      const existingUser = await UserRepository.exists(email, username);
      if (existingUser) {
        const existing = await UserRepository.findByEmailOrUsername(email);
        if (existing.email === email) {
          throw new Error('EMAIL_EXISTS');
        }
        throw new Error('USERNAME_EXISTS');
      }

      const hashedPassword = await hashPassword(password);

      const user = await UserRepository.createWithRole(
        {
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          status: 'active',
          emailVerified: false
        },
        'user'
      );

      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        username: user.username,
        email: user.email
      });

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await RefreshTokenRepository.createToken(
        user.id,
        refreshToken,
        expiresAt
      );

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600
        }
      };
    } catch (error) {
      logger.error('AuthService.register error:', error);
      throw error;
    }
  }

  /**
   * Authenticate a user by username/email/phone and return tokens.
   * @param {string} account - username | email | phone
   * @param {string} password
   * @param {boolean} [rememberMe=false]
   * @returns {Promise<Object>} User data and tokens
   */
  async login(account, password, rememberMe = false) {
    try {
      const user = await UserRepository.findByEmailUsernameOrPhone(account);
      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (user.status !== 'active') {
        throw new Error('ACCOUNT_INACTIVE');
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        throw new Error('INVALID_CREDENTIALS');
      }

      const userWithRoles = await UserRepository.findByIdWithRoles(user.id);

      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        username: user.username,
        email: user.email
      });

      const expiresAt = rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await RefreshTokenRepository.createToken(
        user.id,
        refreshToken,
        expiresAt
      );
      await UserRepository.updateLastLogin(user.id);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: this.sanitizeUser(userWithRoles),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600
        }
      };
    } catch (error) {
      logger.error('AuthService.login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using a valid refresh token.
   * This will revoke the old refresh token and create a new one.
   * @param {string} refreshToken
   * @returns {Promise<Object>} New access and refresh tokens
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('INVALID_TOKEN');
      }

      const isValid = await RefreshTokenRepository.isTokenValid(refreshToken);
      if (!isValid) {
        throw new Error('TOKEN_EXPIRED');
      }

      const user = await UserRepository.findByIdWithRoles(decoded.id);
      if (!user || user.status !== 'active') {
        throw new Error('USER_NOT_FOUND');
      }

      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        email: user.email
      });

      await RefreshTokenRepository.revokeToken(refreshToken);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await RefreshTokenRepository.createToken(
        user.id,
        tokens.refreshToken,
        expiresAt
      );

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600
      };
    } catch (error) {
      logger.error('AuthService.refreshAccessToken error:', error);
      throw error;
    }
  }

  /**
   * Revoke a single refresh token (logout).
   * Verifies the token signature and checks DB record before revoking.
   * @param {string} refreshToken
   * @returns {Promise<boolean>} True if revoked successfully
   */
  async logout(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('INVALID_TOKEN');
      }

      // Verify refresh token trước khi revoke
      const { verifyRefreshToken } = require('@/utils/tokenUtils');
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('INVALID_TOKEN');
      }

      // Kiểm tra token có tồn tại trong database không
      const tokenRecord =
        await RefreshTokenRepository.findByToken(refreshToken);
      if (!tokenRecord) {
        throw new Error('TOKEN_NOT_FOUND');
      }

      // Kiểm tra token đã bị revoke chưa
      if (tokenRecord.revokedAt) {
        throw new Error('TOKEN_ALREADY_REVOKED');
      }

      // Kiểm tra token đã hết hạn chưa
      if (new Date() > tokenRecord.expiresAt) {
        throw new Error('TOKEN_EXPIRED');
      }

      const result = await RefreshTokenRepository.revokeToken(refreshToken);
      logger.info(`User ${decoded.id} logged out successfully`);
      return result;
    } catch (error) {
      logger.error('AuthService.logout error:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a given user id.
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async logoutAll(userId) {
    try {
      await RefreshTokenRepository.revokeAllUserTokens(userId);
      logger.info(`User ${userId} logged out from all devices`);
      return true;
    } catch (error) {
      logger.error('AuthService.logoutAll error:', error);
      throw error;
    }
  }

  /**
   * Get current user by id including roles, sanitized.
   * @param {number} userId
   * @returns {Promise<Object>} Sanitized user object
   */
  async getCurrentUser(userId) {
    try {
      const user = await UserRepository.findByIdWithRoles(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('AuthService.getCurrentUser error:', error);
      throw error;
    }
  }

  /**
   * Remove sensitive fields from user object (password).
   * @param {Object} user
   * @returns {Object} sanitized user
   */
  sanitizeUser(user) {
    const userObj = user.toJSON ? user.toJSON() : user;
    delete userObj.password;
    return userObj;
  }
}

module.exports = new AuthService();
