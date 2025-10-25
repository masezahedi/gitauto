const { Queue, Worker } = require('bullmq');
const redis = require('redis');
require('dotenv').config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const automationQueue = new Queue('automations', { connection });

// Clear old jobs on startup
automationQueue.clean(0, 100);

module.exports = {
  automationQueue,
  connection,
};
