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
const { createReportController } = require('../controllers/report.controller');
const { createReportRoutes } = require('./report.routes');
const { createReportService } = require('../services/reportService');
const { createOcrService } = require('../services/ocrService');
const { createPhotoService } = require('../services/photoService');
const { createPhotoController } = require('../controllers/photo.controller');
const { createPhotoRoutes } = require('./photo.routes');
const { createMeController } = require('../controllers/me.controller');
const { createMeRoutes } = require('./me.routes');
const { createMeService } = require('../services/meService');
const { createMedicationService } = require('../services/medicationService');

/**
 * Builds the /api/v1 router.
 * To add an endpoint: create controller + routes file, then mount it here.
 * repositories is injected (MySQL in production, in-memory fakes in tests).
 * Teammates can use requireAuth / optionalAuth from auth on their own routes.
 */
function buildRouter({
  checkDatabase,
  repositories,
  config,
  authLimiter = passThrough,
  ocrService = createOcrService({ apiKey: config.ocr.apiKey }),
}) {
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

    const reportService = createReportService({
      reportRepository: repositories.reportRepository,
      medicineRepository: repositories.medicineRepository,
    });
    const meService = createMeService({ userRepository: repositories.userRepository });
    const medicationService = createMedicationService({
      userMedicationRepository: repositories.userMedicationRepository,
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
    router.use(
      createPhotoRoutes({
        photoController: createPhotoController({
          photoService: createPhotoService({
            ocrService,
            medicineRepository: repositories.medicineRepository,
          }),
        }),
      }),
    );
    router.use(
      createReportRoutes({
        reportController: createReportController({ reportService }),
        optionalAuth: auth.optionalAuth,
      }),
    );
    router.use(
      createMeRoutes({
        meController: createMeController({ meService, medicationService }),
        requireAuth: auth.requireAuth,
      }),
    );
  }

  return router;
}

module.exports = { buildRouter };
