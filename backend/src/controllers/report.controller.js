const {
  parsePositiveInt,
  parseReportDescription,
  parseOptionalLocation,
} = require('../utils/validators');

function createReportController({ reportService }) {
  return {
    async createReport(req, res) {
      const body = req.body || {};

      const medicineId =
        body.medicineId === undefined || body.medicineId === null
          ? null
          : parsePositiveInt(body.medicineId, 'medicineId');

      const description = parseReportDescription(body.description);
      const location = parseOptionalLocation(body.location);

      const result = await reportService.createReport({
        userId: req.user ? req.user.id : null,
        medicineId,
        description,
        location,
      });

      res.status(201).json(result);
    },
  };
}

module.exports = { createReportController };
