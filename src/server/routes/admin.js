const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { validateParams, validateQuery } = require('../middleware/validation');
const {
  getUserAutomationsSchema,
  disableAutomationSchema,
  getLogsLimitSchema,
} = require('../utils/validationSchemas');

const router = express.Router();

router.get('/users', authMiddleware, adminController.getAllUsers);
router.get('/automations', authMiddleware, adminController.getAllAutomations);
router.get('/automations/:userId', authMiddleware, validateParams(getUserAutomationsSchema), adminController.getUserAutomations);
router.get('/logs', authMiddleware, validateQuery(getLogsLimitSchema), adminController.getExecutionLogs);
router.get('/stats', authMiddleware, adminController.getUserStats);
router.patch('/automations/:automationId/disable', authMiddleware, validateParams(disableAutomationSchema), adminController.disableAutomation);

module.exports = router;
