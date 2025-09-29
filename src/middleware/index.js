// =====================================================
// MIDDLEWARE INDEX
// =====================================================

const errorHandler = require('./errorHandler');
const auth = require('./auth');
const validation = require('./validation');
const rateLimit = require('./rateLimit');
const { corsMiddleware } = require('./cors');

module.exports = {
  errorHandler: errorHandler.errorHandler,
  auth: auth.authenticate,
  validation: validation.validate,
  rateLimit: rateLimit.createRateLimit,
  corsMiddleware
};
