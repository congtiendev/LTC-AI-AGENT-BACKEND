// =====================================================
// API V1 ROUTES INDEX
// =====================================================

const express = require('express');
const authRoutes = require('./auth');

const router = express.Router();

// Health check for API v1
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KleverBot API v1',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      roles: '/api/v1/roles',
      profile: '/api/v1/auth/profile'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);

// TODO: Add other route modules
// router.use('/users', userRoutes);
// router.use('/roles', roleRoutes);

module.exports = router;
