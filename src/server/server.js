const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const pool = require('./utils/db');
const redisClient = require('./utils/redis');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const repositoryRoutes = require('./routes/repositories');
const automationRoutes = require('./routes/automations');
const adminRoutes = require('./routes/admin');

// Import scheduler and worker
const scheduler = require('./jobs/schedulerSimple');
require('./jobs/automationWorker');

// Request logging middleware (morgan)
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'تعداد درخواست‌های زیادی از این IP. لطفاً بعداً تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per 15 minutes
  message: { error: 'تلاش‌های فراوان برای ورود. لطفاً بعداً تلاش کنید.' },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Stricter rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'خیلی‌های درخواست. لطفاً آرام‌تر تلاش کنید.' },
});

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

// Middleware - اضافه کردن global middleware
app.use(compression()); // Response compression برای بهبود performance
app.use(morgan('combined', { stream: morganStream })); // Request logging
app.use(limiter); // Global rate limiting

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

logger.info('Server initialized', { NODE_ENV: process.env.NODE_ENV, PORT });

// Serve built frontend
const distPath = path.join(__dirname, '../../dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
}

// Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes); // Stricter rate limiting for auth
app.use('/api/repositories', apiLimiter, repositoryRoutes);
app.use('/api/automations', apiLimiter, automationRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// Enhanced Health check with database and redis status
app.get('/api/health', async (req, res) => {
  try {
    // Check database
    const dbCheck = await pool.query('SELECT 1');
    const dbConnected = dbCheck.rows.length > 0;

    // Check redis
    const redisConnected = redisClient.isOpen;

    const health = {
      status: dbConnected && redisConnected ? 'healthy' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };

    logger.info('Health check', health);
    res.json(health);
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: 'خطا در بررسی وضعیت سالمت',
      timestamp: new Date().toISOString(),
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Don't expose sensitive information in production
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const response = {
    error: isDevelopment ? err.message : 'خطای داخلی سرور',
  };

  if (isDevelopment) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// SPA catch-all (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'درخواست یافت نشد' });
});

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server started successfully`, { PORT, NODE_ENV: process.env.NODE_ENV });
  
  try {
    // Initialize scheduler
    await scheduler.initialize();
    logger.info('Scheduler initialized');
  } catch (error) {
    logger.error('Failed to initialize scheduler', { error: error.message });
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    scheduler.stopAll();
    await pool.end();
    await redisClient.quit();
    logger.info('All connections closed, exiting');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    scheduler.stopAll();
    await pool.end();
    await redisClient.quit();
    logger.info('All connections closed, exiting');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});
