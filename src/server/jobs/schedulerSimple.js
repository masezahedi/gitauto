const pool = require('../utils/db');
const { automationQueue } = require('../utils/queue');

const scheduledJobs = new Map();

class Scheduler {
  async initialize() {
    try {
      console.log('Scheduler: Loading active automations...');
      
      const query = `
        SELECT id, user_id, cron_expression
        FROM automations
        WHERE is_active = true;
      `;

      const result = await pool.query(query);

      for (const automation of result.rows) {
        this.scheduleAutomation(automation);
      }

      console.log(`Scheduler: ${result.rows.length} automations loaded and scheduled`);
      
      // Start checking every minute
      this.startMainLoop();
    } catch (error) {
      console.error('Scheduler initialization error:', error);
    }
  }

  startMainLoop() {
    setInterval(() => {
      this.checkAndExecute();
    }, 60000); // Check every 60 seconds
  }

  async checkAndExecute() {
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const day = now.getDay(); // 0=Sunday, 1=Monday...

    console.log(`[Scheduler] Check time: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} (day ${day})`);

    scheduledJobs.forEach((cronLines, automationKey) => {
      cronLines.forEach((cronExpr, idx) => {
        const parts = cronExpr.trim().split(' ');
        if (parts.length !== 5) return;

        const [cronMin, cronHour, , , cronDay] = parts.map(Number);
        const cronDays = cronDay.toString().split(',').map(Number);

        // Check if time matches
        if (minute === cronMin && hour === cronHour && cronDays.includes(day)) {
          const automationId = automationKey.replace('auto_', '');
          console.log(`[Scheduler] ⏱️  TRIGGERED: Automation ${automationId}, CRON: ${cronExpr}`);
          this.executeJob(automationId);
        }
      });
    });
  }

  async executeJob(automationId) {
    try {
      console.log(`[Scheduler] Fetching automation ${automationId} from DB...`);
      
      const query = `SELECT user_id FROM automations WHERE id = $1 AND is_active = true`;
      const result = await pool.query(query, [automationId]);

      if (result.rows.length === 0) {
        console.error(`[Scheduler] Automation ${automationId} not found or inactive`);
        return;
      }

      const userId = result.rows[0].user_id;
      console.log(`[Scheduler] Adding to queue: automation ${automationId}, user ${userId}`);

      const queueJob = await automationQueue.add(
        `automation_${automationId}`,
        { automationId: parseInt(automationId), userId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }
      );

      console.log(`[Scheduler] ✅ Job queued with ID: ${queueJob.id}`);
    } catch (error) {
      console.error(`[Scheduler] Error executing job:`, error);
    }
  }

  scheduleAutomation(automation) {
    try {
      const { id, user_id, cron_expression } = automation;
      const jobKey = `auto_${id}`;

      const cronLines = cron_expression.trim().split('\n').map(l => l.trim()).filter(l => l);
      console.log(`[Scheduler] Scheduling automation ${id} with ${cronLines.length} CRON line(s):`);
      cronLines.forEach((line, idx) => {
        console.log(`  [${idx + 1}] ${line}`);
      });

      scheduledJobs.set(jobKey, cronLines);
    } catch (error) {
      console.error(`[Scheduler] Error scheduling automation ${automation.id}:`, error);
    }
  }

  activateAutomation(automation) {
    this.scheduleAutomation(automation);
  }

  deactivateAutomation(automationId) {
    const jobKey = `auto_${automationId}`;
    if (scheduledJobs.has(jobKey)) {
      scheduledJobs.delete(jobKey);
      console.log(`[Scheduler] Automation ${automationId} deactivated`);
    }
  }

  updateAutomation(automation) {
    this.deactivateAutomation(automation.id);
    this.scheduleAutomation(automation);
  }

  stopAll() {
    scheduledJobs.clear();
    console.log('Scheduler: All jobs stopped');
  }
}

module.exports = new Scheduler();
