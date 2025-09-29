// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const jwt = require('jsonwebtoken');
const logger = require('@/utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    logger.debug(`Authenticated user: ${decoded.id}`);
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
