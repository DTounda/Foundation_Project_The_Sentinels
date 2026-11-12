const { Router } = require('express');

function createMedicineRoutes({ medicineController }) {
  const router = Router();

  router.get('/medicines/:id', medicineController.getMedicine);

  return router;
}

module.exports = { createMedicineRoutes };