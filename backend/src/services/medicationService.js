const AppError = require('../utils/AppError');

function createMedicationService({ userMedicationRepository }) {
  return {
    list(userId) {
      return userMedicationRepository.listByUser(userId);
    },

    create(userId, name) {
      return userMedicationRepository.create(userId, name);
    },

    async get(userId, medicationId) {
      const medication = await userMedicationRepository.findByUser(userId, medicationId);
      if (!medication) throw AppError.notFound('Medication not found');
      return medication;
    },

    async update(userId, medicationId, name) {
      const medication = await userMedicationRepository.update(userId, medicationId, name);
      if (!medication) throw AppError.notFound('Medication not found');
      return medication;
    },

    async remove(userId, medicationId) {
      const removed = await userMedicationRepository.remove(userId, medicationId);
      if (!removed) throw AppError.notFound('Medication not found');
    },
  };
}

module.exports = { createMedicationService };