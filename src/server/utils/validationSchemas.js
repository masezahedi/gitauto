const Joi = require('joi');

// Auth Schemas
const getGitHubUrlSchema = Joi.object({});

const gitHubCallbackSchema = Joi.object({
  code: Joi.string().required().messages({
    'string.empty': 'کد احراز هویت خالی است',
    'any.required': 'کد احراز هویت الزامی است',
  }),
});

// Repository Schemas
const addRepositorySchema = Joi.object({
  github_repo_id: Joi.number().required().messages({
    'number.base': 'شناسه مخزن باید عدد باشد',
    'any.required': 'شناسه مخزن الزامی است',
  }),
  repo_name: Joi.string().max(255).required().messages({
    'string.empty': 'نام مخزن خالی است',
    'string.max': 'نام مخزن نباید بیشتر از 255 کاراکتر باشد',
    'any.required': 'نام مخزن الزامی است',
  }),
  repo_full_name: Joi.string().max(255).required(),
  repo_url: Joi.string().uri().max(500).required().messages({
    'string.uri': 'URL مخزن نامعتبر است',
  }),
});

const removeRepositorySchema = Joi.object({
  repositoryId: Joi.number().required(),
});

// Automation Schemas
const cronExpressionSchema = Joi.string()
  .pattern(/^\d{1,2}\s\d{1,2}\s[\d\*]{1,2}\s[\d\*]{1,2}\s[\d\*]{1,2}(\n\d{1,2}\s\d{1,2}\s[\d\*]{1,2}\s[\d\*]{1,2}\s[\d\*]{1,2})*$/)
  .required()
  .messages({
    'string.pattern.base': 'فرمت CRON نادرست است. باید به صورت "دقیقه ساعت روز ماه هفته" باشد',
    'any.required': 'عبارت CRON الزامی است',
  });

const filePathSchema = Joi.string()
  .pattern(/^[^<>:"|?*\0]+$/)
  .max(500)
  .required()
  .messages({
    'string.empty': 'مسیر فایل خالی است',
    'string.pattern.base': 'مسیر فایل حاوی کاراکترهای غیرمعتبر است',
    'string.max': 'مسیر فایل نباید بیشتر از 500 کاراکتر باشد',
    'any.required': 'مسیر فایل الزامی است',
  });

const createAutomationSchema = Joi.object({
  repositoryId: Joi.number().required().messages({
    'number.base': 'شناسه مخزن باید عدد باشد',
    'any.required': 'شناسه مخزن الزامی است',
  }),
  filePath: filePathSchema,
  contentToAdd: Joi.string().max(50000).required().messages({
    'string.empty': 'محتوا برای اضافه کردن خالی است',
    'string.max': 'محتوا نباید بیشتر از 50000 کاراکتر باشد',
    'any.required': 'محتوا الزامی است',
  }),
  cronExpression: cronExpressionSchema,
});

const updateAutomationSchema = Joi.object({
  automationId: Joi.number().required(),
  filePath: filePathSchema.optional(),
  contentToAdd: Joi.string().max(50000).optional(),
  cronExpression: cronExpressionSchema.optional(),
  isActive: Joi.boolean().optional(),
});

const deleteAutomationSchema = Joi.object({
  automationId: Joi.number().required(),
});

const getLogsSchema = Joi.object({
  automationId: Joi.number().required(),
  limit: Joi.number().default(50).max(500).optional(),
});

// Admin Schemas
const getUserAutomationsSchema = Joi.object({
  userId: Joi.number().required(),
});

const disableAutomationSchema = Joi.object({
  automationId: Joi.number().required(),
});

const getLogsLimitSchema = Joi.object({
  limit: Joi.number().default(100).max(1000).optional(),
});

module.exports = {
  // Auth
  getGitHubUrlSchema,
  gitHubCallbackSchema,
  // Repository
  addRepositorySchema,
  removeRepositorySchema,
  // Automation
  createAutomationSchema,
  updateAutomationSchema,
  deleteAutomationSchema,
  getLogsSchema,
  // Admin
  getUserAutomationsSchema,
  disableAutomationSchema,
  getLogsLimitSchema,
};
