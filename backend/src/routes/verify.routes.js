const { Router } = require('express');

function createVerifyRoutes({ verifyController, optionalAuth }) {
  const router = Router();
  router.post('/verify/barcode', optionalAuth, verifyController.verifyBarcode);
  return router;
}

module.exports = { createVerifyRoutes };
