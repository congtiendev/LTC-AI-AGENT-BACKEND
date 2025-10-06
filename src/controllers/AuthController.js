// src/controllers/AuthController.js
const { validationResult } = require('express-validator');
const AuthService = require('@/services/AuthService');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Controller responsible for authentication-related endpoints.
 * Each method maps to an Express route and returns a standardized API response.
 * @class AuthController
 */
class AuthController {
  /**
   * Register a new user.
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<import('express').Response>}
   */
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

  /**
   * Login user and return access/refresh tokens.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
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

  /**
   * Refresh access token using a valid refresh token.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
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

  /**
   * Logout a user by revoking the provided refresh token.
   * Body should contain: { refreshToken: string }
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async logout(req, res) {
    try {
      // Debug logging
      logger.info('Logout request body:', req.body);
      logger.info('Content-Type:', req.headers['content-type']);

      const { refreshToken } = req.body;

      if (!refreshToken) {
        logger.warn('Missing refresh token in request body');
        return ApiResponse.badRequest(res, 'Refresh token is required');
      }

      const result = await AuthService.logout(refreshToken);
      if (!result) {
        return ApiResponse.unauthorized(res, 'Invalid or expired token');
      }

      return ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      logger.error('AuthController.logout error:', error);

      if (
        error.message === 'INVALID_TOKEN' ||
        error.message === 'TOKEN_NOT_FOUND'
      ) {
        return ApiResponse.unauthorized(res, 'Invalid or expired token');
      }

      return ApiResponse.error(res, 'Logout failed');
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices).
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
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

  /**
   * Get profile of current authenticated user.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
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
