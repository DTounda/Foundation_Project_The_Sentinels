const AppError = require('../utils/AppError');
const { DISCLAIMER } = require('../messages/resultMessages');

function createMedicineService({ medicineRepository }) {
  return {
    async getMedicineDetails(medicineId) {
      const medicine = await medicineRepository.findById(medicineId);

      if (!medicine) {
        throw AppError.notFound('Medicine not found');
      }

      const ingredients = await medicineRepository.getIngredients(medicineId);

      return {
        medicine,
        ingredients,
        disclaimer: DISCLAIMER,
      };
    },
  };
}

module.exports = { createMedicineService };
