/**
 * Email Module - Main Export
 * Centralized export for the complete email management system
 */

const EmailModule = require('./EmailModule');
const emailRoutes = require('./routes/emailRoutes');

// Controllers
const EmailController = require('./controllers/EmailController');
const EmailTemplateController = require('./controllers/EmailTemplateController');
const EmailHistoryController = require('./controllers/EmailHistoryController');

// Services
const EmailTemplateService = require('./services/EmailTemplateService');
const EmailHistoryService = require('./services/EmailHistoryService');

// Repositories
const EmailHistoryRepository = require('./repositories/EmailHistoryRepository');

// Validators
const emailValidators = require('./validators/emailValidators');

module.exports = {
  // Main module
  EmailModule,

  // Routes
  emailRoutes,

  // Controllers
  EmailController,
  EmailTemplateController,
  EmailHistoryController,

  // Services
  EmailTemplateService,
  EmailHistoryService,

  // Repositories
  EmailHistoryRepository,

  // Validators
  emailValidators
};
