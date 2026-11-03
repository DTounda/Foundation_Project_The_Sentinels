const { Router } = require('express');
const { createHealthController } = require('../controllers/health.controller');
const { createHealthRoutes } = require('./health.routes');
const { createVerifyController } = require('../controllers/verify.controller');
const { createVerifyRoutes } = require('./verify.routes');
const { createAuthController } = require('../controllers/auth.controller');
const { createAuthRoutes } = require('./auth.routes');
const { createAllergyController } = require('../controllers/allergy.controller');
const { createAllergyRoutes } = require('./allergy.routes');
const { createAllergyService } = require('../services/allergyService');
const { createVerificationService } = require('../services/verificationService');
const { createAuthService } = require('../services/authService');
const { createAuthMiddleware } = require('../middleware/auth');
const { passThrough } = require('../middleware/rateLimit');
const { createMedicineController } = require('../controllers/medicine.controller');
const { createMedicineRoutes } = require('./medicine.routes');
const { createMedicineService } = require('../services/medicineService');

/**
 * Builds the /api/v1 router.
 * To add an endpoint: create controller + routes file, then mount it here.
 * `repositories` is injected (MySQL in production, in-memory fakes in tests).
 * Teammates can use `requireAuth` / `optionalAuth` from `auth` on their own routes.
 */
function buildRouter({ checkDatabase, repositories, config, authLimiter = passThrough }) {
  const router = Router();

  router.use(createHealthRoutes({ healthController: createHealthController({ checkDatabase }) }));

  if (repositories) {
    const authService = createAuthService({ userRepository: repositories.userRepository, config });
    const auth = createAuthMiddleware({ authService });
    const allergyService = createAllergyService(repositories);
    const verificationService = createVerificationService({ ...repositories, allergyService });
    const medicineService = createMedicineService({
      medicineRepository: repositories.medicineRepository,
    });

    router.use(
      createAuthRoutes({ authController: createAuthController({ authService }), authLimiter }),
    );
    router.use(
      createVerifyRoutes({
        verifyController: createVerifyController({ verificationService }),
        optionalAuth: auth.optionalAuth,
      }),
    );
    router.use(
      createAllergyRoutes({
        allergyController: createAllergyController({ allergyService }),
        requireAuth: auth.requireAuth,
      }),
    );
    router.use(
      createMedicineRoutes({
        medicineController: createMedicineController({ medicineService }),
      }),
    );
  }

  return router;
}

module.exports = { buildRouter };