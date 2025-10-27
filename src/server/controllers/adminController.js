const pool = require('../utils/db');
const logger = require('../utils/logger');

class AdminController {
  async getAllUsers(req, res) {
    try {
      const adminId = req.user.id;

      // Verify admin access
      const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
      const adminResult = await pool.query(adminQuery, [adminId]);
      
      if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      const query = `
        SELECT id, github_username, email, name, avatar_url, created_at
        FROM users
        ORDER BY created_at DESC;
      `;

      const result = await pool.query(query);
      logger.info('All users retrieved', { count: result.rows.length });
      res.json(result.rows);
    } catch (error) {
      logger.error('Error retrieving all users', { message: error.message });
      res.status(500).json({ error: 'خطا در دریافت کاربران' });
    }
  }

  async getAllAutomations(req, res) {
    try {
      const adminId = req.user.id;

      // Verify admin access
      const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
      const adminResult = await pool.query(adminQuery, [adminId]);
      
      if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      const query = `
        SELECT 
          a.id,
          a.file_path,
          a.content_to_add,
          a.cron_expression,
          a.schedule_description,
          a.is_active,
          a.created_at,
          a.updated_at,
          u.github_username,
          r.repo_name,
          r.repo_full_name
        FROM automations a
        JOIN users u ON a.user_id = u.id
        JOIN repositories r ON a.repository_id = r.id
        ORDER BY a.created_at DESC;
      `;

      const result = await pool.query(query);
      logger.info('All automations retrieved', { count: result.rows.length });
      res.json(result.rows);
    } catch (error) {
      logger.error('Error retrieving all automations', { message: error.message });
      res.status(500).json({ error: 'خطا در دریافت اتوماسیون‌ها' });
    }
  }

  async getUserAutomations(req, res) {
    try {
      const adminId = req.user.id;
      const { userId } = req.params;

      // Verify admin access
      const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
      const adminResult = await pool.query(adminQuery, [adminId]);
      
      if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

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
      logger.info('User automations retrieved (admin)', { userId, count: result.rows.length });
      res.json(result.rows);
    } catch (error) {
      logger.error('Error retrieving user automations (admin)', { userId, message: error.message });
      res.status(500).json({ error: 'خطا در دریافت اتوماسیون‌ها' });
    }
  }

  async getExecutionLogs(req, res) {
    try {
      const adminId = req.user.id;
      const { limit = 100 } = req.query;

      // Verify admin access
      const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
      const adminResult = await pool.query(adminQuery, [adminId]);
      
      if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      const query = `
        SELECT 
          el.id,
          el.status,
          el.message,
          el.executed_at,
          a.file_path,
          u.github_username,
          r.repo_name
        FROM execution_logs el
        JOIN automations a ON el.automation_id = a.id
        JOIN users u ON el.user_id = u.id
        JOIN repositories r ON a.repository_id = r.id
        ORDER BY el.executed_at DESC
        LIMIT $1;
      `;

      const result = await pool.query(query, [limit]);
      logger.info('Execution logs retrieved (admin)', { count: result.rows.length });
      res.json(result.rows);
    } catch (error) {
      logger.error('Error retrieving execution logs (admin)', { message: error.message });
      res.status(500).json({ error: 'خطا در دریافت لاگ‌ها' });
    }
  }

  async getUserStats(req, res) {
    try {
      const adminId = req.user.id;

      // Verify admin access
      const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
      const adminResult = await pool.query(adminQuery, [adminId]);
      
      if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      const stats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM repositories) as total_repositories,
          (SELECT COUNT(*) FROM automations) as total_automations,
          (SELECT COUNT(*) FROM execution_logs) as total_executions,
          (SELECT COUNT(*) FROM execution_logs WHERE status = 'success') as successful_executions,
          (SELECT COUNT(*) FROM execution_logs WHERE status = 'failed') as failed_executions;
      `);

      logger.info('User stats retrieved', { stats: stats.rows[0] });
      res.json(stats.rows[0]);
    } catch (error) {
      logger.error('Error retrieving user stats', { message: error.message });
      res.status(500).json({ error: 'خطا در دریافت آمار' });
    }
  }

  async disableAutomation(req, res) {
    try {
      const adminId = req.user.id;
      const { automationId } = req.params;

      // Verify admin access
      const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
      const adminResult = await pool.query(adminQuery, [adminId]);
      
      if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
        return res.status(403).json({ error: 'شما مجاز نیستید' });
      }

      const query = `
        UPDATE automations
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, is_active;
      `;

      const result = await pool.query(query, [automationId]);

      if (result.rows.length === 0) {
        logger.warn('Automation not found for disabling', { automationId });
        return res.status(404).json({ error: 'اتوماسیون یافت نشد' });
      }

      logger.info('Automation disabled (admin)', { automationId });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error disabling automation (admin)', { automationId, message: error.message });
      res.status(500).json({ error: 'خطا در غیرفعال کردن اتوماسیون' });
    }
  }
}

module.exports = new AdminController();
