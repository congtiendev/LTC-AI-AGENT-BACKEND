const { body } = require('express-validator');

const requestResetValidator = [
  body('email').isEmail().withMessage('Valid email is required')
];

module.exports = {
  requestResetValidator
};
