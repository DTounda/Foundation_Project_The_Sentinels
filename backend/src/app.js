const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const defaultConfig = require('./config/env');
const { buildRouter } = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { createRateLimiter, passThrough } = require('./middleware/rateLimit');

/**
 * Creates the Express app. Everything that touches the outside world (database, config)
 * is passed in, so tests can run the whole API with fakes and no MySQL.
 */
function createApp({
  config = defaultConfig,
  checkDatabase = async () => true,
  repositories = null,
  enableRateLimit = config.nodeEnv !== 'test',
  ocrService,
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim()),
    }),
  );
  app.use('/api/v1/verify/photo', express.json({ limit: '5mb' }));
  app.use(express.json({ limit: '10kb' }));

  const limiter = enableRateLimit
    ? createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 300 })
    : passThrough;
  const authLimiter = enableRateLimit
    ? createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 20 })
    : passThrough;
  app.use(
    '/api/v1',
    limiter,
    buildRouter({ checkDatabase, repositories, config, authLimiter, ocrService }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
