const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const juice = require('juice');

const templatesDir = path.join(__dirname, '..', 'templates', 'emails');

/**
 * Load and compile a template with layout and partials.
 * @param {string} name - template file without extension
 * @param {Object} data - template context
 */
const renderTemplate = (name, data = {}) => {
  // register partials
  const partialsDir = path.join(templatesDir, 'partials');
  fs.readdirSync(partialsDir).forEach(file => {
    if (file.endsWith('.hbs')) {
      const partialName = path.basename(file, '.hbs');
      const content = fs.readFileSync(path.join(partialsDir, file), 'utf8');
      handlebars.registerPartial(partialName, content);
    }
  });

  // register layout
  const layoutPath = path.join(templatesDir, 'layouts', 'base.hbs');
  const layout = fs.readFileSync(layoutPath, 'utf8');

  const templatePath = path.join(templatesDir, `${name}.hbs`);
  const body = fs.readFileSync(templatePath, 'utf8');

  const styles = fs.readFileSync(path.join(templatesDir, 'styles.css'), 'utf8');

  const compiledBody = handlebars.compile(body)(data);
  const final = handlebars.compile(layout)({ ...data, body: compiledBody, styles });

  // inline CSS for email clients
  return juice(final);
};

module.exports = {
  renderTemplate
};
