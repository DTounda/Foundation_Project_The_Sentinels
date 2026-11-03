const { Router } = require('express');

function createReportRoutes({ reportController, optionalAuth }) {
  const router = Router();

  router.post('/reports', optionalAuth, reportController.createReport);

  return router;
}

module.exports = { createReportRoutes };