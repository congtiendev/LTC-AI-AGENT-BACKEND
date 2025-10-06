const express = require('express');
const { requestReset } = require('@/controllers/passwordResetController');
const { requestResetValidator } = require('@/validators/passwordResetValidator');
const router = express.Router();

router.post('/password-reset', requestResetValidator, requestReset);

module.exports = router;
