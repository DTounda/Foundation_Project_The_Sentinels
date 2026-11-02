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
  enableRateLimit = config.nodeEnv !== 'test',
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim()),
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  const limiter = enableRateLimit
    ? createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 300 })
    : passThrough;
  app.use('/api/v1', limiter, buildRouter({ checkDatabase }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
