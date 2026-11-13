const { Router } = require('express');

function createPhotoRoutes({ photoController }) {
  const router = Router();
  router.post('/verify/photo', photoController.verifyPhoto);
  return router;
}

module.exports = { createPhotoRoutes };
