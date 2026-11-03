const { Router } = require('express');

function createVerifyRoutes({ verifyController, optionalAuth }) {
  const router = Router();

  router.post('/verify/barcode', optionalAuth, verifyController.verifyBarcode);

  router.get('/medicines/search', optionalAuth, verifyController.searchMedicines);

  return router;
}

module.exports = { createVerifyRoutes };
