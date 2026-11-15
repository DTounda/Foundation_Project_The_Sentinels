const { Router } = require('express');

function createMedicineRoutes({ medicineController, requireAuth }) {
  const router = Router();

  router.get('/medicines/:id', medicineController.getMedicine);
  router.get('/medicines/:id/interactions', requireAuth, medicineController.getInteractions);

  return router;
}

module.exports = { createMedicineRoutes };