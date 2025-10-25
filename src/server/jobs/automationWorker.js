const { Worker } = require('bullmq');
const pool = require('../utils/db');
const gitOps = require('../utils/gitOperations');
const { connection } = require('../utils/queue');
const encryption = require('../utils/encryption');
require('dotenv').config();

const worker = new Worker(
  'automations',
  async (job) => {
    try {
      const { automationId, userId } = job.data;
      console.log(`[Worker] Starting job for automation ${automationId}, user ${userId}`);

      // Fetch automation details with user info
      const autoQuery = `
        SELECT a.*, r.repo_url, r.repo_full_name, u.access_token, u.github_username, u.email, u.name
        FROM automations a
        JOIN repositories r ON a.repository_id = r.id
        JOIN users u ON a.user_id = u.id
        WHERE a.id = $1 AND a.user_id = $2 AND a.is_active = true;
      `;

      console.log(`[Worker] Fetching automation details...`);
      const autoResult = await pool.query(autoQuery, [automationId, userId]);
      console.log(`[Worker] Query result rows: ${autoResult.rows.length}`);

      if (autoResult.rows.length === 0) {
        throw new Error('Automation not found or inactive');
      }

      const automation = autoResult.rows[0];
      console.log(`[Worker] Automation found: ${automation.repo_full_name}, file: ${automation.file_path}`);
      console.log(`[Worker] Content to add: ${automation.content_to_add}`);
      console.log(`[Worker] Access token available: ${!!automation.access_token}`);
      console.log(`[Worker] User: ${automation.github_username} (${automation.email})`);

      // Decrypt access token
      const decryptedToken = encryption.decrypt(automation.access_token);
      console.log(`[Worker] Token decrypted successfully`);

      // Clone or pull repo
      console.log(`[Worker] Cloning/pulling repository...`);
      const repoPath = await gitOps.cloneOrPull(
        automation.repo_url,
        `${userId}-${automation.repo_full_name}`,
        decryptedToken
      );
      console.log(`[Worker] Repository path: ${repoPath}`);

      // Execute automation
      const commitMessage = `Updated ${automation.file_path} at ${new Date().toISOString()}`;
      console.log(`[Worker] Executing automation with message: ${commitMessage}`);
      
      // Use ONLY the user who created the automation
      // Don't use app owner credentials
      const userName = automation.github_username;
      const userEmail = automation.email || `${automation.github_username}@github.com`;
      console.log(`[Worker] Committing as: ${userName} <${userEmail}>`);
      
      await gitOps.executeAutomation(
        repoPath,
        automation.repo_url,
        automation,
        decryptedToken,
        commitMessage,
        userName,
        userEmail
      );
      console.log(`[Worker] Automation executed successfully by ${userName}`);

      // Log success
      console.log(`[Worker] Logging success...`);
      const logQuery = `
        INSERT INTO execution_logs (automation_id, user_id, status, message)
        VALUES ($1, $2, $3, $4);
      `;

      await pool.query(logQuery, [
        automationId,
        userId,
        'success',
        `Successfully executed at ${new Date().toISOString()}`,
      ]);

      console.log(`[Worker] ✅ Automation ${automationId} executed successfully`);

      return { success: true };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      // Log error
      try {
        const { automationId, userId } = job.data;
        const logQuery = `
          INSERT INTO execution_logs (automation_id, user_id, status, message)
          VALUES ($1, $2, $3, $4);
        `;

        await pool.query(logQuery, [
          automationId,
          userId,
          'failed',
          error.message,
        ]);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

module.exports = worker;
