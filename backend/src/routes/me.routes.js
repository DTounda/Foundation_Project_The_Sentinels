const { Router } = require('express');

function createMeRoutes({ meController, requireAuth }) {
  const router = Router();
  router.get('/me', requireAuth, meController.getProfile);
  router.put('/me/account', requireAuth, meController.updateAccount);
  router.put('/me/doctor', requireAuth, meController.updateDoctor);
  router.put('/me/pharmacy', requireAuth, meController.updatePharmacy);
  router.get('/me/medications', requireAuth, meController.listMedications);
  router.post('/me/medications', requireAuth, meController.createMedication);
  router.get('/me/medications/:id', requireAuth, meController.getMedication);
  router.put('/me/medications/:id', requireAuth, meController.updateMedication);
  router.delete('/me/medications/:id', requireAuth, meController.deleteMedication);
  return router;
}

module.exports = { createMeRoutes };