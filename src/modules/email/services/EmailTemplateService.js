/**
 * EmailTemplateService
 * Enhanced service for managing email templates with CRUD operations
 */

const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const juice = require('juice');
const logger = require('@/utils/logger');

/**
 * Enhanced Email Template Service with full CRUD operations
 */
class EmailTemplateService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../../../templates/emails');
    this.layoutsDir = path.join(this.templatesDir, 'layouts');
    this.partialsDir = path.join(this.templatesDir, 'partials');
    this.stylesPath = path.join(this.templatesDir, 'styles.css');

    this.compiledTemplates = new Map();
    this.templateCache = new Map();

    this.initializeHandlebars();
  }

  /**
   * Initialize Handlebars with helpers and partials
   */
  async initializeHandlebars() {
    try {
      // Register custom helpers
      this.registerHelpers();

      // Load and register partials
      await this.loadPartials();

      logger.info('EmailTemplateService: Handlebars initialized successfully');
    } catch (error) {
      logger.error('EmailTemplateService initialization error:', error);
      throw error;
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  registerHelpers() {
    // Date formatting helper
    handlebars.registerHelper(
      'formatDate',
      (date, _format = 'YYYY-MM-DD HH:mm:ss') => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
      }
    );

    // URL helper
    handlebars.registerHelper('url', path => {
      const baseUrl = process.env.APP_URL || 'http://localhost:8000';
      return `${baseUrl}${path}`;
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });

    // Uppercase helper
    handlebars.registerHelper('uppercase', str => {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    // JSON helper
    handlebars.registerHelper('json', context => {
      return JSON.stringify(context);
    });
  }

  /**
   * Load and register all partials
   */
  async loadPartials() {
    try {
      const partialFiles = await fs.readdir(this.partialsDir);

      for (const file of partialFiles) {
        if (file.endsWith('.hbs')) {
          const partialName = path.basename(file, '.hbs');
          const partialPath = path.join(this.partialsDir, file);
          const partialContent = await fs.readFile(partialPath, 'utf8');

          handlebars.registerPartial(partialName, partialContent);
          logger.debug(
            `EmailTemplateService: Registered partial: ${partialName}`
          );
        }
      }
    } catch (error) {
      logger.warn(
        'EmailTemplateService: Error loading partials:',
        error.message
      );
    }
  }

  /**
   * Get list of all available templates
   * @returns {Promise<Array>} List of template information
   */
  async getTemplateList() {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templates = [];

      for (const file of files) {
        if (file.endsWith('.hbs') && !file.startsWith('base')) {
          const templatePath = path.join(this.templatesDir, file);
          const stats = await fs.stat(templatePath);
          const templateName = path.basename(file, '.hbs');

          // Try to extract template metadata from comments
          const content = await fs.readFile(templatePath, 'utf8');
          const metadata = this.extractTemplateMetadata(content);

          templates.push({
            name: templateName,
            filename: file,
            path: templatePath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.ctime,
            description: metadata.description || '',
            variables: metadata.variables || [],
            category: metadata.category || 'general'
          });
        }
      }

      return templates.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      logger.error('EmailTemplateService.getTemplateList error:', error);
      throw error;
    }
  }

  /**
   * Get template content by name
   * @param {string} templateName - Template name
   * @returns {Promise<Object>} Template information and content
   */
  async getTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch {
        throw new Error(`TEMPLATE_NOT_FOUND: ${templateName}`);
      }

      const content = await fs.readFile(templatePath, 'utf8');
      const stats = await fs.stat(templatePath);
      const metadata = this.extractTemplateMetadata(content);

      return {
        name: templateName,
        filename: `${templateName}.hbs`,
        path: templatePath,
        content,
        size: stats.size,
        modified: stats.mtime,
        created: stats.ctime,
        description: metadata.description || '',
        variables: metadata.variables || [],
        category: metadata.category || 'general',
        metadata
      };
    } catch (error) {
      logger.error('EmailTemplateService.getTemplate error:', error);
      throw error;
    }
  }

  /**
   * Create a new email template
   * @param {string} templateName - Template name
   * @param {string} content - Template content
   * @param {Object} metadata - Template metadata
   * @returns {Promise<Object>} Created template information
   */
  async createTemplate(templateName, content, metadata = {}) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      // Check if template already exists
      try {
        await fs.access(templatePath);
        throw new Error(`TEMPLATE_EXISTS: ${templateName}`);
      } catch (error) {
        if (error.message.includes('TEMPLATE_EXISTS')) throw error;
        // Template doesn't exist, which is what we want
      }

      // Add metadata comments to template
      const templateWithMetadata = this.addMetadataToTemplate(
        content,
        metadata
      );

      // Validate template syntax
      try {
        handlebars.compile(templateWithMetadata);
      } catch (error) {
        throw new Error(`TEMPLATE_SYNTAX_ERROR: ${error.message}`);
      }

      // Write template file
      await fs.writeFile(templatePath, templateWithMetadata, 'utf8');

      // Clear cache
      this.clearTemplateCache(templateName);

      logger.info('EmailTemplateService: Created template', {
        templateName,
        path: templatePath
      });

      // Return template information
      return await this.getTemplate(templateName);
    } catch (error) {
      logger.error('EmailTemplateService.createTemplate error:', error);
      throw error;
    }
  }

  /**
   * Update an existing email template
   * @param {string} templateName - Template name
   * @param {string} content - New template content
   * @param {Object} metadata - Template metadata
   * @returns {Promise<Object>} Updated template information
   */
  async updateTemplate(templateName, content, metadata = {}) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch {
        throw new Error(`TEMPLATE_NOT_FOUND: ${templateName}`);
      }

      // Add metadata comments to template
      const templateWithMetadata = this.addMetadataToTemplate(
        content,
        metadata
      );

      // Validate template syntax
      try {
        handlebars.compile(templateWithMetadata);
      } catch (error) {
        throw new Error(`TEMPLATE_SYNTAX_ERROR: ${error.message}`);
      }

      // Backup old template
      const backupPath = `${templatePath}.backup.${Date.now()}`;
      const oldContent = await fs.readFile(templatePath, 'utf8');
      await fs.writeFile(backupPath, oldContent, 'utf8');

      // Write updated template
      await fs.writeFile(templatePath, templateWithMetadata, 'utf8');

      // Clear cache
      this.clearTemplateCache(templateName);

      logger.info('EmailTemplateService: Updated template', {
        templateName,
        path: templatePath,
        backup: backupPath
      });

      // Return updated template information
      return await this.getTemplate(templateName);
    } catch (error) {
      logger.error('EmailTemplateService.updateTemplate error:', error);
      throw error;
    }
  }

  /**
   * Delete an email template
   * @param {string} templateName - Template name
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch {
        throw new Error(`TEMPLATE_NOT_FOUND: ${templateName}`);
      }

      // Create backup before deletion
      const backupPath = path.join(
        path.dirname(templatePath),
        'deleted',
        `${templateName}.${Date.now()}.hbs`
      );

      // Ensure backup directory exists
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      // Backup and delete
      const content = await fs.readFile(templatePath, 'utf8');
      await fs.writeFile(backupPath, content, 'utf8');
      await fs.unlink(templatePath);

      // Clear cache
      this.clearTemplateCache(templateName);

      logger.info('EmailTemplateService: Deleted template', {
        templateName,
        path: templatePath,
        backup: backupPath
      });

      return true;
    } catch (error) {
      logger.error('EmailTemplateService.deleteTemplate error:', error);
      throw error;
    }
  }

  /**
   * Render template with data (existing method enhanced)
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @param {Object} options - Rendering options
   * @returns {Promise<Object>} Rendered HTML and text
   */
  async renderTemplate(templateName, data = {}, options = {}) {
    try {
      const { useCache = true, inlineCSS = true } = options;

      // Check cache first
      const cacheKey = `${templateName}-${JSON.stringify(data)}`;
      if (useCache && this.templateCache.has(cacheKey)) {
        return this.templateCache.get(cacheKey);
      }

      // Get compiled template
      const template = await this.getCompiledTemplate(templateName);

      // Prepare template data with defaults
      const templateData = {
        ...data,
        year: new Date().getFullYear(),
        appName: process.env.APP_NAME || 'KleverBot',
        appUrl: process.env.APP_URL || 'http://localhost:8000',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@kleverbot.com'
      };

      // Render template
      let html = template(templateData);

      // Inline CSS if requested
      if (inlineCSS) {
        try {
          const cssContent = await fs.readFile(this.stylesPath, 'utf8');
          html = juice.inlineContent(html, cssContent, {
            removeStyleTags: false,
            preserveMediaQueries: true,
            preserveFontFaces: true
          });
        } catch (error) {
          logger.warn(
            'EmailTemplateService: CSS inlining failed:',
            error.message
          );
        }
      }

      // Generate plain text version
      const text = this.htmlToText(html);

      const result = { html, text };

      // Cache result
      if (useCache) {
        this.templateCache.set(cacheKey, result);
      }

      logger.debug('EmailTemplateService: Rendered template', {
        templateName,
        dataKeys: Object.keys(data),
        htmlLength: html.length,
        textLength: text.length
      });

      return result;
    } catch (error) {
      logger.error('EmailTemplateService.renderTemplate error:', error);
      throw error;
    }
  }

  /**
   * Get compiled template (cached)
   * @param {string} templateName - Template name
   * @returns {Promise<Function>} Compiled Handlebars template
   */
  async getCompiledTemplate(templateName) {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName);
    }

    const templateInfo = await this.getTemplate(templateName);
    const compiled = handlebars.compile(templateInfo.content);

    this.compiledTemplates.set(templateName, compiled);
    return compiled;
  }

  /**
   * Extract metadata from template comments
   * @param {string} content - Template content
   * @returns {Object} Extracted metadata
   */
  extractTemplateMetadata(content) {
    const metadata = {
      description: '',
      variables: [],
      category: 'general'
    };

    // Extract description from <!--! Description: ... --> comments
    const descMatch = content.match(/<!--!\s*Description:\s*(.+?)\s*-->/);
    if (descMatch) {
      metadata.description = descMatch[1];
    }

    // Extract variables from {{variable}} patterns
    const variableMatches = content.match(/\{\{([^{}]+)\}\}/g);
    if (variableMatches) {
      const variables = new Set();
      variableMatches.forEach(match => {
        const variable = match.replace(/[{}]/g, '').trim();
        if (
          !variable.startsWith('#') &&
          !variable.startsWith('/') &&
          !variable.startsWith('>')
        ) {
          variables.add(variable);
        }
      });
      metadata.variables = Array.from(variables);
    }

    // Extract category from <!--! Category: ... --> comments
    const categoryMatch = content.match(/<!--!\s*Category:\s*(.+?)\s*-->/);
    if (categoryMatch) {
      metadata.category = categoryMatch[1];
    }

    return metadata;
  }

  /**
   * Add metadata comments to template content
   * @param {string} content - Template content
   * @param {Object} metadata - Metadata to add
   * @returns {string} Template with metadata comments
   */
  addMetadataToTemplate(content, metadata) {
    const comments = [];

    if (metadata.description) {
      comments.push(`<!--! Description: ${metadata.description} -->`);
    }

    if (metadata.category) {
      comments.push(`<!--! Category: ${metadata.category} -->`);
    }

    if (metadata.author) {
      comments.push(`<!--! Author: ${metadata.author} -->`);
    }

    if (metadata.version) {
      comments.push(`<!--! Version: ${metadata.version} -->`);
    }

    const metadataHeader =
      comments.length > 0 ? comments.join('\n') + '\n\n' : '';

    return metadataHeader + content;
  }

  /**
   * Clear template cache
   * @param {string} [templateName] - Specific template to clear, or all if not provided
   */
  clearTemplateCache(templateName) {
    if (templateName) {
      this.compiledTemplates.delete(templateName);

      // Clear template cache entries for this template
      for (const [key] of this.templateCache) {
        if (key.startsWith(`${templateName}-`)) {
          this.templateCache.delete(key);
        }
      }
    } else {
      this.compiledTemplates.clear();
      this.templateCache.clear();
    }

    logger.debug('EmailTemplateService: Cleared template cache', {
      templateName
    });
  }

  /**
   * Convert HTML to plain text
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate template syntax
   * @param {string} content - Template content
   * @returns {Object} Validation result
   */
  validateTemplate(content) {
    try {
      handlebars.compile(content);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Preview template with sample data
   * @param {string} templateName - Template name
   * @param {Object} sampleData - Sample data for preview
   * @returns {Promise<Object>} Preview result
   */
  async previewTemplate(templateName, sampleData = {}) {
    try {
      // Get template info to extract variables
      const templateInfo = await this.getTemplate(templateName);

      // Generate sample data if not provided
      const previewData = { ...sampleData };

      templateInfo.variables.forEach(variable => {
        if (!previewData[variable]) {
          previewData[variable] = this.generateSampleValue(variable);
        }
      });

      // Render template
      const rendered = await this.renderTemplate(templateName, previewData, {
        useCache: false
      });

      return {
        templateName,
        sampleData: previewData,
        variables: templateInfo.variables,
        ...rendered
      };
    } catch (error) {
      logger.error('EmailTemplateService.previewTemplate error:', error);
      throw error;
    }
  }

  /**
   * Generate sample value for template variable
   * @param {string} variable - Variable name
   * @returns {string} Sample value
   */
  generateSampleValue(variable) {
    const lowerVar = variable.toLowerCase();

    if (lowerVar.includes('name') || lowerVar.includes('username')) {
      return 'John Doe';
    }
    if (lowerVar.includes('email')) {
      return 'john.doe@example.com';
    }
    if (lowerVar.includes('url') || lowerVar.includes('link')) {
      return 'https://example.com/sample-link';
    }
    if (lowerVar.includes('date') || lowerVar.includes('time')) {
      return new Date().toLocaleDateString();
    }
    if (lowerVar.includes('token') || lowerVar.includes('code')) {
      return 'ABC123XYZ789';
    }
    if (lowerVar.includes('phone')) {
      return '+1 (555) 123-4567';
    }
    if (lowerVar.includes('company') || lowerVar.includes('organization')) {
      return 'Sample Company Inc.';
    }

    return `[${variable}]`;
  }
}

module.exports = new EmailTemplateService();
