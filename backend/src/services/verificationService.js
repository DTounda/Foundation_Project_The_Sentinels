
const { buildResult } = require('./resultBuilder');

function createVerificationService({
  medicineRepository,
  verificationLogRepository,
  allergyService,
  logger = console,
}) {
  /** A failed log write must never break the answer the user is waiting for. */
  async function saveLog({ userId, medicine, method, result, allergyWarning }) {
    try {
      await verificationLogRepository.create({
        userId,
        medicineId: medicine ? medicine.id : null,
        method,
        result,
        allergyWarning,
      });
    } catch (err) {
      logger.error('Could not save verification log:', err.message);
    }
  }

  return {
    /** Verify a scanned barcode. userId is null for anonymous checks. */
    async verifyByBarcode({ barcode, userId = null }) {
      const medicine = await medicineRepository.findByBarcode(barcode);
      const allergyAlerts = medicine
        ? await allergyService.getAlertsForMedicine(userId, medicine.id)
        : [];
      const result = buildResult(medicine, allergyAlerts);

      await saveLog({
        userId,
        medicine,
        method: 'scan',
        result: result.status,
        allergyWarning: allergyAlerts.length > 0,
      });

      return result;
    },

    /** Search medicines by name. */
    async searchByName({ query, userId = null }) {
      const medicines = await medicineRepository.searchByName(query);
      const results = [];

      for (const medicine of medicines) {
        const allergyAlerts = await allergyService.getAlertsForMedicine(
          userId,
          medicine.id,
        );

        const result = buildResult(medicine, allergyAlerts);
        results.push(result);

        await saveLog({
          userId,
          medicine,
          method: 'search',
          result: result.status,
          allergyWarning: allergyAlerts.length > 0,
        });
      }

      if (medicines.length === 0) {
        const result = buildResult(null);
        await saveLog({
          userId,
          medicine: null,
          method: 'search',
          result: result.status,
          allergyWarning: false,
        });
      }

      return {
        results,
        disclaimer: buildResult(null).disclaimer,
      };
    },
  };
}

module.exports = { createVerificationService };
