// src/services/AuthService.js
const UserRepository = require('@/repositories/UserRepository');
const RefreshTokenRepository = require('@/repositories/RefreshTokenRepository');
const { hashPassword, comparePassword } = require('@/utils/passwordUtils');
const { generateTokens, verifyRefreshToken } = require('@/utils/tokenUtils');
const logger = require('@/utils/logger');

class AuthService {
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

  async logout(refreshToken) {
    try {
      if (refreshToken) {
        await RefreshTokenRepository.revokeToken(refreshToken);
      }
      logger.info('User logged out');
      return true;
    } catch (error) {
      logger.error('AuthService.logout error:', error);
      throw error;
    }
  }

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

  sanitizeUser(user) {
    const userObj = user.toJSON ? user.toJSON() : user;
    delete userObj.password;
    return userObj;
  }
}

module.exports = new AuthService();
