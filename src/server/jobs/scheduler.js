const { CronJob } = require('cron');
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
    } catch (error) {
      console.error('Scheduler initialization error:', error);
    }
  }

  scheduleAutomation(automation) {
    try {
      const { id, user_id, cron_expression } = automation;
      const jobKey = `auto_${id}`;

      // Remove existing job if any
      if (scheduledJobs.has(jobKey)) {
        const jobs = scheduledJobs.get(jobKey);
        if (Array.isArray(jobs)) {
          jobs.forEach(j => j.stop());
        } else {
          jobs.stop();
        }
        scheduledJobs.delete(jobKey);
      }

      // Handle multi-line CRON expressions
      const cronLines = cron_expression.trim().split('\n').map(l => l.trim()).filter(l => l);
      const jobs = [];

      cronLines.forEach((cronExpr, idx) => {
        try {
          console.log(`[Scheduler] Scheduling CRON ${idx + 1}/${cronLines.length}: ${cronExpr}`);
          const job = new CronJob(cronExpr, async () => {
            try {
              console.log(`[Scheduler] ⏱️  Triggered automation ${id} (CRON ${idx + 1}/${cronLines.length})`);
              console.log(`[Scheduler] Adding to queue...`);
              
              // Add job to queue
              const queueJob = await automationQueue.add(
                `automation_${id}_${idx}`,
                { automationId: id, userId: user_id },
                {
                  attempts: 3,
                  backoff: {
                    type: 'exponential',
                    delay: 2000,
                  },
                }
              );
              console.log(`[Scheduler] Job added to queue: ${queueJob.id}`);
            } catch (error) {
              console.error(`[Scheduler] Error queueing job for automation ${id}:`, error);
            }
          }, null, true);
          jobs.push(job);
        } catch (error) {
          console.error(`Error parsing CRON line "${cronExpr}" for automation ${id}:`, error);
        }
      });

      scheduledJobs.set(jobKey, jobs);
      console.log(`Scheduler: Automation ${id} scheduled with ${cronLines.length} expression(s)`);

      return jobs;
    } catch (error) {
      console.error(`Error scheduling automation ${automation.id}:`, error);
    }
  }

  activateAutomation(automation) {
    this.scheduleAutomation(automation);
  }

  deactivateAutomation(automationId) {
    const jobKey = `auto_${automationId}`;

    if (scheduledJobs.has(jobKey)) {
      const jobs = scheduledJobs.get(jobKey);
      if (Array.isArray(jobs)) {
        jobs.forEach(j => j.stop());
      } else {
        jobs.stop();
      }
      scheduledJobs.delete(jobKey);
      console.log(`Scheduler: Automation ${automationId} deactivated`);
    }
  }

  updateAutomation(automation) {
    this.deactivateAutomation(automation.id);
    this.scheduleAutomation(automation);
  }

  stopAll() {
    scheduledJobs.forEach((job) => {
      job.stop();
    });
    scheduledJobs.clear();
    console.log('Scheduler: All jobs stopped');
  }
}

module.exports = new Scheduler();
