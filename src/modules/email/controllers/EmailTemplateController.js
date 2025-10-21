/**
 * EmailTemplateController
 * Handles HTTP requests for email template management
 */

const { validationResult } = require('express-validator');
const EmailTemplateService = require('../services/EmailTemplateService');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Controller for email template operations
 */
class EmailTemplateController {
  /**
   * Get list of all email templates
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getTemplates(req, res) {
    try {
      const templates = await EmailTemplateService.getTemplateList();

      return ApiResponse.success(
        res,
        templates,
        'Templates retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.getTemplates error:', error);
      return ApiResponse.error(res, 'Failed to retrieve templates');
    }
  }

  /**
   * Get specific template by name
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getTemplate(req, res) {
    try {
      const { name } = req.params;
      const template = await EmailTemplateService.getTemplate(name);

      return ApiResponse.success(
        res,
        template,
        'Template retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.getTemplate error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.notFound(
          res,
          `Template '${req.params.name}' not found`
        );
      }

      return ApiResponse.error(res, 'Failed to retrieve template');
    }
  }

  /**
   * Create new email template
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async createTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { name, content, metadata = {} } = req.body;

      // Validate template syntax before creating
      const validation = EmailTemplateService.validateTemplate(content);
      if (!validation.isValid) {
        return ApiResponse.badRequest(
          res,
          'Template syntax error',
          validation.errors
        );
      }

      const template = await EmailTemplateService.createTemplate(
        name,
        content,
        metadata
      );

      logger.info('EmailTemplateController: Template created', {
        templateName: name,
        userId: req.user?.id
      });

      return ApiResponse.created(
        res,
        template,
        'Template created successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.createTemplate error:', error);

      if (error.message.includes('TEMPLATE_EXISTS')) {
        return ApiResponse.conflict(res, 'Template already exists');
      }

      if (error.message.includes('TEMPLATE_SYNTAX_ERROR')) {
        return ApiResponse.badRequest(res, error.message);
      }

      return ApiResponse.error(res, 'Failed to create template');
    }
  }

  /**
   * Update existing email template
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async updateTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { name } = req.params;
      const { content, metadata = {} } = req.body;

      // Validate template syntax before updating
      const validation = EmailTemplateService.validateTemplate(content);
      if (!validation.isValid) {
        return ApiResponse.badRequest(
          res,
          'Template syntax error',
          validation.errors
        );
      }

      const template = await EmailTemplateService.updateTemplate(
        name,
        content,
        metadata
      );

      logger.info('EmailTemplateController: Template updated', {
        templateName: name,
        userId: req.user?.id
      });

      return ApiResponse.success(
        res,
        template,
        'Template updated successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.updateTemplate error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.notFound(
          res,
          `Template '${req.params.name}' not found`
        );
      }

      if (error.message.includes('TEMPLATE_SYNTAX_ERROR')) {
        return ApiResponse.badRequest(res, error.message);
      }

      return ApiResponse.error(res, 'Failed to update template');
    }
  }

  /**
   * Delete email template
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async deleteTemplate(req, res) {
    try {
      const { name } = req.params;

      await EmailTemplateService.deleteTemplate(name);

      logger.info('EmailTemplateController: Template deleted', {
        templateName: name,
        userId: req.user?.id
      });

      return ApiResponse.success(res, null, 'Template deleted successfully');
    } catch (error) {
      logger.error('EmailTemplateController.deleteTemplate error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.notFound(
          res,
          `Template '${req.params.name}' not found`
        );
      }

      return ApiResponse.error(res, 'Failed to delete template');
    }
  }

  /**
   * Preview template with sample or provided data
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async previewTemplate(req, res) {
    try {
      const { name } = req.params;
      const sampleData = req.body || {};

      const preview = await EmailTemplateService.previewTemplate(
        name,
        sampleData
      );

      return ApiResponse.success(
        res,
        preview,
        'Template preview generated successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.previewTemplate error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.notFound(
          res,
          `Template '${req.params.name}' not found`
        );
      }

      return ApiResponse.error(res, 'Failed to generate template preview');
    }
  }

  /**
   * Render template as HTML for browser preview
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async renderTemplateHtml(req, res) {
    try {
      const { name } = req.params;
      const sampleData = req.query || {};

      const preview = await EmailTemplateService.previewTemplate(
        name,
        sampleData
      );

      res.setHeader('Content-Type', 'text/html');
      return res.send(preview.html);
    } catch (error) {
      logger.error('EmailTemplateController.renderTemplateHtml error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return res.status(404).send(`
          <html>
            <body>
              <h1>Template Not Found</h1>
              <p>Template '${req.params.name}' was not found.</p>
            </body>
          </html>
        `);
      }

      return res.status(500).send(`
        <html>
          <body>
            <h1>Template Error</h1>
            <p>Failed to render template: ${error.message}</p>
          </body>
        </html>
      `);
    }
  }

  /**
   * Test template rendering with provided data
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async testTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { name } = req.params;
      const { data = {}, options = {} } = req.body;

      const rendered = await EmailTemplateService.renderTemplate(name, data, {
        ...options,
        useCache: false // Don't cache test renders
      });

      return ApiResponse.success(
        res,
        {
          templateName: name,
          testData: data,
          rendered
        },
        'Template test completed successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.testTemplate error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.notFound(
          res,
          `Template '${req.params.name}' not found`
        );
      }

      return ApiResponse.error(res, 'Template test failed');
    }
  }

  /**
   * Validate template syntax
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async validateTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { content } = req.body;
      const validation = EmailTemplateService.validateTemplate(content);

      return ApiResponse.success(
        res,
        validation,
        validation.isValid ? 'Template is valid' : 'Template has syntax errors'
      );
    } catch (error) {
      logger.error('EmailTemplateController.validateTemplate error:', error);
      return ApiResponse.error(res, 'Template validation failed');
    }
  }

  /**
   * Clear template cache
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async clearCache(req, res) {
    try {
      const { name } = req.params;

      EmailTemplateService.clearTemplateCache(name);

      logger.info('EmailTemplateController: Template cache cleared', {
        templateName: name,
        userId: req.user?.id
      });

      return ApiResponse.success(
        res,
        null,
        name
          ? `Cache cleared for template '${name}'`
          : 'All template cache cleared'
      );
    } catch (error) {
      logger.error('EmailTemplateController.clearCache error:', error);
      return ApiResponse.error(res, 'Failed to clear template cache');
    }
  }

  /**
   * Get template statistics and usage information
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getTemplateStats(req, res) {
    try {
      const templates = await EmailTemplateService.getTemplateList();

      const stats = {
        totalTemplates: templates.length,
        categories: {},
        totalSize: 0,
        lastModified: null
      };

      templates.forEach(template => {
        // Count by category
        stats.categories[template.category] =
          (stats.categories[template.category] || 0) + 1;

        // Sum sizes
        stats.totalSize += template.size;

        // Find latest modification
        if (!stats.lastModified || template.modified > stats.lastModified) {
          stats.lastModified = template.modified;
        }
      });

      return ApiResponse.success(
        res,
        {
          ...stats,
          templates: templates.map(t => ({
            name: t.name,
            category: t.category,
            size: t.size,
            modified: t.modified,
            variableCount: t.variables.length
          }))
        },
        'Template statistics retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailTemplateController.getTemplateStats error:', error);
      return ApiResponse.error(res, 'Failed to retrieve template statistics');
    }
  }
}

module.exports = new EmailTemplateController();
