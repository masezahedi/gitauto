const pool = require('../utils/db');
const { automationQueue } = require('../utils/queue');
const scheduler = require('../jobs/schedulerSimple');
const cronstrue = require('cronstrue');
const logger = require('../utils/logger');
const { createAutomationSchema, updateAutomationSchema, deleteAutomationSchema, getLogsSchema } = require('../utils/validationSchemas');

class AutomationController {
  async createAutomation(req, res) {
    try {
      const userId = req.user.id;
      const { repositoryId, filePath, contentToAdd, cronExpression } = req.body;
      // Validation is done by middleware

      // Validate cron expression (handle multi-line)
      const cronLines = cronExpression.trim().split('\n');
      for (const line of cronLines) {
        const cronParts = line.trim().split(' ');
        if (cronParts.length !== 5) {
          logger.warn('Invalid CRON format', { userId, cronExpression });
          return res.status(400).json({ error: 'فرمت CRON نادرست' });
        }
      }

      // Get schedule description
      let scheduleDescription = '';
      try {
        // Use first CRON line for description
        const firstCron = cronLines[0].trim();
        scheduleDescription = cronstrue.toString(firstCron, { locale: 'fa' });
      } catch {
        scheduleDescription = cronExpression;
      }

      // Verify user owns the repository
      const repoQuery = 'SELECT id FROM repositories WHERE id = $1 AND user_id = $2';
      const repoResult = await pool.query(repoQuery, [repositoryId, userId]);

      if (repoResult.rows.length === 0) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      // Create automation
      const query = `
        INSERT INTO automations (user_id, repository_id, file_path, content_to_add, cron_expression, schedule_description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, file_path, cron_expression, schedule_description, is_active;
      `;

      const result = await pool.query(query, [
        userId,
        repositoryId,
        filePath,
        contentToAdd,
        cronExpression,
        scheduleDescription,
      ]);

      // Immediately schedule the automation
      const automation = result.rows[0];
      scheduler.scheduleAutomation({
        id: automation.id,
        user_id: userId,
        cron_expression: cronExpression,
      });
      logger.info('Automation created and scheduled', {
        userId,
        automationId: automation.id,
        repositoryId,
        cronExpression,
      });

      res.status(201).json(automation);
    } catch (error) {
      logger.error('Automation creation error', { userId, message: error.message });
      res.status(500).json({ error: 'خطا در ایجاد اتوماسیون' });
    }
  }

  async getUserAutomations(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          a.id,
          a.file_path,
          a.content_to_add,
          a.cron_expression,
          a.schedule_description,
          a.is_active,
          a.created_at,
          r.repo_name,
          r.repo_full_name
        FROM automations a
        JOIN repositories r ON a.repository_id = r.id
        WHERE a.user_id = $1
        ORDER BY a.created_at DESC;
      `;

      const result = await pool.query(query, [userId]);
      logger.info('Automations retrieved', { userId, count: result.rows.length });
      res.json(result.rows);
    } catch (error) {
      logger.error('Error retrieving automations', { userId, message: error.message });
      res.status(500).json({ error: 'خطا در دریافت اتوماسیون‌ها' });
    }
  }

  async updateAutomation(req, res) {
    try {
      const userId = req.user.id;
      const { automationId } = req.params;
      const { filePath, contentToAdd, cronExpression, isActive } = req.body;

      // Verify ownership
      const ownerQuery = 'SELECT user_id FROM automations WHERE id = $1';
      const ownerResult = await pool.query(ownerQuery, [automationId]);

      if (ownerResult.rows.length === 0) {
        logger.warn('Automation not found for update', { userId, automationId });
        return res.status(404).json({ error: 'اتوماسیون یافت نشد' });
      }

      if (ownerResult.rows[0].user_id !== userId) {
        logger.warn('Unauthorized automation update attempt', { userId, automationId });
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      let scheduleDescription = '';
      if (cronExpression) {
        try {
          scheduleDescription = cronstrue.toString(cronExpression, { locale: 'fa' });
        } catch {
          scheduleDescription = cronExpression;
        }
      }

      const query = `
        UPDATE automations
        SET 
          file_path = COALESCE($2, file_path),
          content_to_add = COALESCE($3, content_to_add),
          cron_expression = COALESCE($4, cron_expression),
          schedule_description = COALESCE($5, schedule_description),
          is_active = COALESCE($6, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const result = await pool.query(query, [
        automationId,
        filePath,
        contentToAdd,
        cronExpression,
        scheduleDescription,
        isActive,
      ]);

      logger.info('Automation updated', { userId, automationId });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Automation update error', { userId, automationId, message: error.message });
      res.status(500).json({ error: 'خطا در بروزرسانی اتوماسیون' });
    }
  }

  async deleteAutomation(req, res) {
    try {
      const userId = req.user.id;
      const { automationId } = req.params;

      const query = `
        DELETE FROM automations
        WHERE id = $1 AND user_id = $2
        RETURNING id;
      `;

      const result = await pool.query(query, [automationId, userId]);

      if (result.rows.length === 0) {
        logger.warn('Automation not found for deletion', { userId, automationId });
        return res.status(404).json({ error: 'اتوماسیون یافت نشد' });
      }

      logger.info('Automation deleted', { userId, automationId });
      res.json({ message: 'اتوماسیون حذف شد' });
    } catch (error) {
      logger.error('Automation deletion error', { userId, automationId, message: error.message });
      res.status(500).json({ error: 'خطا در حذف اتوماسیون' });
    }
  }

  async getExecutionLogs(req, res) {
    try {
      const userId = req.user.id;
      const { automationId } = req.params;
      const { limit = 50 } = req.query;

      // Verify ownership
      const ownerQuery = 'SELECT user_id FROM automations WHERE id = $1';
      const ownerResult = await pool.query(ownerQuery, [automationId]);

      if (ownerResult.rows.length === 0) {
        logger.warn('Automation not found for logs', { userId, automationId });
        return res.status(404).json({ error: 'اتوماسیون یافت نشد' });
      }

      if (ownerResult.rows[0].user_id !== userId) {
        logger.warn('Unauthorized logs access attempt', { userId, automationId });
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      const query = `
        SELECT id, status, message, executed_at
        FROM execution_logs
        WHERE automation_id = $1
        ORDER BY executed_at DESC
        LIMIT $2;
      `;

      const result = await pool.query(query, [automationId, limit]);
      logger.info('Execution logs retrieved', { userId, automationId, count: result.rows.length });
      res.json(result.rows);
    } catch (error) {
      logger.error('Error retrieving execution logs', { userId, automationId, message: error.message });
      res.status(500).json({ error: 'خطا در دریافت لاگ‌ها' });
    }
  }
}

module.exports = new AutomationController();
