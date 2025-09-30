// =====================================================
// MAIN ROUTES INDEX
// =====================================================

const express = require('express');
const v1Routes = require('./api/v1');

const router = express.Router();

// API versioning
router.use('/v1', v1Routes);

// Default redirect to v1
router.use('/', v1Routes);

module.exports = router;
