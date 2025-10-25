const express = require('express');
const automationController = require('../controllers/automationController');
const authMiddleware = require('../middleware/auth');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const {
  createAutomationSchema,
  updateAutomationSchema,
  deleteAutomationSchema,
  getLogsSchema,
  getLogsLimitSchema,
} = require('../utils/validationSchemas');

const router = express.Router();

router.post('/', authMiddleware, validateBody(createAutomationSchema), automationController.createAutomation);
router.get('/', authMiddleware, automationController.getUserAutomations);
router.put('/:automationId', authMiddleware, validateParams(deleteAutomationSchema), validateBody(updateAutomationSchema), automationController.updateAutomation);
router.delete('/:automationId', authMiddleware, validateParams(deleteAutomationSchema), automationController.deleteAutomation);
router.get('/:automationId/logs', authMiddleware, validateParams(getLogsSchema), validateQuery(getLogsLimitSchema), automationController.getExecutionLogs);

module.exports = router;
