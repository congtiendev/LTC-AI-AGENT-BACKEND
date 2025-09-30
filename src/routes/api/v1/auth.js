// =====================================================
// AUTH ROUTES - /api/v1/auth
// =====================================================

const express = require('express');
const AuthController = require('@/controllers/AuthController');
const { auth } = require('@/middleware');
const { authRateLimit, registerRateLimit } = require('@/middleware/rateLimit');
const {
  registerValidator,
  loginValidator,
  refreshValidator
} = require('@/validators/authValidators');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password, firstName, lastName, phone }
 */
router.post(
  '/register',
  registerRateLimit,
  registerValidator,
  AuthController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 * @body    { identifier, password, rememberMe }
 */
router.post('/login', authRateLimit, loginValidator, AuthController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', refreshValidator, AuthController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { refreshToken }
 */
router.post('/logout', auth, AuthController.logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.get('/profile', auth, AuthController.me);

module.exports = router;
