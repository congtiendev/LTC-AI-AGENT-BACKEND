const express = require('express');
const { renderTemplate } = require('@/services/emailTemplateService');
const router = express.Router();

// Simple preview endpoints for templates during development
router.get('/preview/:template', (req, res) => {
  const template = req.params.template;
  try {
    const html = renderTemplate(template, { firstName: 'Tester', resetUrl: '#', year: new Date().getFullYear(), expiresIn: 60 });
    res.send(html);
  } catch (error) {
    res.status(500).send('Template render error');
  }
});

module.exports = router;
