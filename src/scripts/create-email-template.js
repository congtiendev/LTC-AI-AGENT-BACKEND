const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'templates', 'emails');

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

console.log('Email templates directory created at', templatesDir);
