// src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Token utilities - generate and verify JWT access/refresh tokens.
 * @module tokenUtils
 */

/**
 * Generate access and refresh tokens
 * @param {Object} payload - User data to encode
 * @returns {Object} { accessToken, refreshToken }
 */
/**
 * Generate access and refresh tokens
 * @param {Object} payload - User data to encode
 * @param {number|string} payload.id - User id
 * @param {string} payload.username
 * @param {string} [payload.email]
 * @returns {{accessToken:string, refreshToken:string}}
 */
const generateTokens = payload => {
  const accessToken = jwt.sign(
    {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      type: 'access'
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
      issuer: 'kleverbot-api',
      audience: 'kleverbot-client'
    }
  );

  const refreshToken = jwt.sign(
    {
      id: payload.id,
      username: payload.username,
      type: 'refresh',
      jti: crypto.randomUUID()
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'kleverbot-api',
      audience: 'kleverbot-client'
    }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null
 */
/**
 * Verify access token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null
 */
const verifyAccessToken = token => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'kleverbot-api',
      audience: 'kleverbot-client'
    });

    if (decoded.type !== 'access') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null
 */
/**
 * Verify refresh token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null
 */
const verifyRefreshToken = token => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'kleverbot-api',
      audience: 'kleverbot-client'
    });

    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader
 * @returns {string|null}
 */
/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader
 * @returns {string|null}
 */
const extractTokenFromHeader = authHeader => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
};

/**
 * Decode token without verification
 * @param {string} token
 * @returns {Object|null}
 */
const decodeToken = token => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeToken
};
