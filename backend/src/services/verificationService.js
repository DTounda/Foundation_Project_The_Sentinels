const { buildResult } = require('./resultBuilder');

function createVerificationService({
  medicineRepository,
  verificationLogRepository,
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
      const result = buildResult(medicine);
      await saveLog({
        userId,
        medicine,
        method: 'scan',
        result: result.status,
        allergyWarning: false,
      });
      return result;
    },
  };
}

module.exports = { createVerificationService };
