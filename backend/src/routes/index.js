const { Router } = require('express');
const { createHealthController } = require('../controllers/health.controller');
const { createHealthRoutes } = require('./health.routes');
const { createVerifyController } = require('../controllers/verify.controller');
const { createVerifyRoutes } = require('./verify.routes');
const { createVerificationService } = require('../services/verificationService');

/**
 * Builds the /api/v1 router.
 * To add an endpoint: create controller + routes file, then mount it here.
 * `repositories` is injected (MySQL in production, in-memory fakes in tests).
 */
function buildRouter({ checkDatabase, repositories }) {
  const router = Router();

  router.use(createHealthRoutes({ healthController: createHealthController({ checkDatabase }) }));

  if (repositories) {
    const verificationService = createVerificationService(repositories);
    router.use(
      createVerifyRoutes({ verifyController: createVerifyController({ verificationService }) }),
    );
  }

  return router;
}

module.exports = { buildRouter };
