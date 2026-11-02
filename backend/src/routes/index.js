const { Router } = require('express');
const { createHealthController } = require('../controllers/health.controller');
const { createHealthRoutes } = require('./health.routes');

/**
 * Builds the /api/v1 router.
 * To add an endpoint: create controller + routes file, then mount it here.
 */
function buildRouter({ checkDatabase }) {
  const router = Router();

  router.use(createHealthRoutes({ healthController: createHealthController({ checkDatabase }) }));

  return router;
}

module.exports = { buildRouter };
