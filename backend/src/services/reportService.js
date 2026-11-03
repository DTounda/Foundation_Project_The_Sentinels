const AppError = require('../utils/AppError');

function createReportService({ reportRepository, medicineRepository }) {
  return {
    async createReport({ userId = null, medicineId = null, description, location = null }) {
      if (medicineId !== null) {
        const medicine = await medicineRepository.findById(medicineId);

        if (!medicine) {
          throw AppError.notFound('Medicine not found');
        }
      }

      const report = await reportRepository.create({
        userId,
        medicineId,
        description,
        location,
      });

      return { report };
    },
  };
}

module.exports = { createReportService };