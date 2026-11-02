const { rateLimit } = require('express-rate-limit');
const AppError = require('../utils/AppError');

/** Build a limiter that answers with our standard error shape. */
function createRateLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests, please try again later')),
  });
}

const passThrough = (_req, _res, next) => next();

module.exports = { createRateLimiter, passThrough };
