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
      // If this lookup fails we let the request fail (500): showing "Verified" without the
      // allergy alerts a logged-in user expects would be worse than showing an error.
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
  };
}

module.exports = { createVerificationService };
