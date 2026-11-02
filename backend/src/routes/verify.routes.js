const { Router } = require('express');

function createVerifyRoutes({ verifyController }) {
  const router = Router();
  router.post('/verify/barcode', verifyController.verifyBarcode);
  return router;
}

module.exports = { createVerifyRoutes };
