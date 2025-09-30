// src/controllers/AuthController.js
const { validationResult } = require('express-validator');
const AuthService = require('@/services/AuthService');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const result = await AuthService.register(req.body);
      return ApiResponse.created(res, result, 'Registration successful');
    } catch (error) {
      logger.error('AuthController.register error:', error);

      if (error.message === 'EMAIL_EXISTS') {
        return ApiResponse.badRequest(res, 'Email already registered');
      }
      if (error.message === 'USERNAME_EXISTS') {
        return ApiResponse.badRequest(res, 'Username already taken');
      }

      return ApiResponse.error(res, 'Registration failed');
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { account, password, rememberMe } = req.body;
      const result = await AuthService.login(account, password, rememberMe);

      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      logger.error('AuthController.login error:', error);

      if (error.message === 'INVALID_CREDENTIALS') {
        return ApiResponse.unauthorized(
          res,
          'Invalid username/email/phone or password'
        );
      }
      if (error.message === 'ACCOUNT_INACTIVE') {
        return ApiResponse.forbidden(res, 'Account is not active');
      }

      return ApiResponse.error(res, 'Login failed');
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh token is required');
      }

      const result = await AuthService.refreshAccessToken(refreshToken);
      return ApiResponse.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      logger.error('AuthController.refreshToken error:', error);

      if (
        error.message === 'INVALID_TOKEN' ||
        error.message === 'TOKEN_EXPIRED'
      ) {
        return ApiResponse.unauthorized(
          res,
          'Invalid or expired refresh token'
        );
      }

      return ApiResponse.error(res, 'Token refresh failed');
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      return ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      logger.error('AuthController.logout error:', error);
      return ApiResponse.error(res, 'Logout failed');
    }
  }

  async logoutAll(req, res) {
    try {
      const userId = req.user.id;
      await AuthService.logoutAll(userId);
      return ApiResponse.success(res, null, 'Logged out from all devices');
    } catch (error) {
      logger.error('AuthController.logoutAll error:', error);
      return ApiResponse.error(res, 'Logout failed');
    }
  }

  async me(req, res) {
    try {
      const userId = req.user.id;
      const user = await AuthService.getCurrentUser(userId);
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      logger.error('AuthController.me error:', error);

      if (error.message === 'USER_NOT_FOUND') {
        return ApiResponse.notFound(res, 'User not found');
      }

      return ApiResponse.error(res, 'Failed to get user information');
    }
  }
}

module.exports = new AuthController();
