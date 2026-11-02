const { Router } = require('express');

function createAuthRoutes({ authController, authLimiter }) {
  const router = Router();
  // Stricter rate limit on login/register to slow down password guessing.
  router.post('/auth/register', authLimiter, authController.register);
  router.post('/auth/login', authLimiter, authController.login);
  return router;
}

module.exports = { createAuthRoutes };
