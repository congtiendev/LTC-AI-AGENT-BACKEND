// src/middleware/auth.js
const {
  verifyAccessToken,
  extractTokenFromHeader
} = require('@/utils/tokenUtils');
const UserRepository = require('@/repositories/UserRepository');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Authentication middleware - verifies access token and attaches user to req.
 * Returns 401 when token missing/invalid, 403 when account inactive.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access token is required');
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return ApiResponse.unauthorized(res, 'Invalid or expired token');
    }

    const user = await UserRepository.findByIdWithRoles(decoded.id);
    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    if (user.status !== 'active') {
      return ApiResponse.forbidden(res, 'Account is not active');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
      status: user.status
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return ApiResponse.error(res, 'Authentication failed');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      req.user = null;
      return next();
    }

    const user = await UserRepository.findByIdWithRoles(decoded.id);
    if (!user || user.status !== 'active') {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
      status: user.status
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const hasRole = (...roleNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    const userRoles = req.user.roles.map(role => role.name);
    const hasRequiredRole = roleNames.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  const userRoles = req.user.roles.map(role => role.name);
  const isAdminUser =
    userRoles.includes('admin') || userRoles.includes('super_admin');

  if (!isAdminUser) {
    return ApiResponse.forbidden(res, 'Admin access required');
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  hasRole,
  isAdmin
};
