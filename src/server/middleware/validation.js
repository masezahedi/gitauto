const logger = require('../utils/logger');

/**
 * Validate request body against Joi schema
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} - Express middleware
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn('Validation error', { details, path: req.path });

        return res.status(400).json({
          error: 'خطا در اعتبارسنجی',
          details,
        });
      }

      req.validatedBody = value;
      req.body = value; // Replace body with validated data
      next();
    } catch (error) {
      logger.error('Validation middleware error', { error: error.message });
      res.status(500).json({ error: 'خطا در فرآیند اعتبارسنجی' });
    }
  };
};

/**
 * Validate request params against Joi schema
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} - Express middleware
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn('Params validation error', { details, path: req.path });

        return res.status(400).json({
          error: 'خطا در اعتبارسنجی پارامترها',
          details,
        });
      }

      req.validatedParams = value;
      req.params = value;
      next();
    } catch (error) {
      logger.error('Params validation middleware error', { error: error.message });
      res.status(500).json({ error: 'خطا در فرآیند اعتبارسنجی' });
    }
  };
};

/**
 * Validate request query against Joi schema
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} - Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        logger.warn('Query validation error', { details, path: req.path });

        return res.status(400).json({
          error: 'خطا در اعتبارسنجی پارامترهای query',
          details,
        });
      }

      req.validatedQuery = value;
      req.query = value;
      next();
    } catch (error) {
      logger.error('Query validation middleware error', { error: error.message });
      res.status(500).json({ error: 'خطا در فرآیند اعتبارسنجی' });
    }
  };
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
};
