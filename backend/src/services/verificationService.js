const { buildResult } = require('./resultBuilder');
const AppError = require('../utils/AppError');

function createVerificationService({
  medicineRepository,
  verificationLogRepository,
  allergyService,
  logger = console,
}) {
  /** Save one log without breaking the verification response. */
  async function saveLog(entry) {
    try {
      await verificationLogRepository.create(entry);
    } catch (err) {
      logger.error('Could not save verification log:', err.message);
    }
  }

  /** Save multiple logs together when the repository supports batch writes. */
  async function saveLogs(entries) {
    if (entries.length === 0) return;

    if (typeof verificationLogRepository.createMany === 'function') {
      try {
        await verificationLogRepository.createMany(entries);
      } catch (err) {
        logger.error('Could not save verification logs:', err.message);
      }

      return;
    }

    await Promise.all(entries.map((entry) => saveLog(entry)));
  }

  return {
    /** Verify a scanned barcode. userId is null for anonymous checks. */
    async verifyByBarcode({ barcode, userId = null }) {
      // If this lookup fails, we let the request fail rather than returning an unverified result.
      const medicine = await medicineRepository.findByBarcode(barcode);

      const allergyAlerts = medicine
        ? await allergyService.getAlertsForMedicine(userId, medicine.id)
        : [];

      const result = buildResult(medicine, allergyAlerts);

      await saveLog({
        userId,
        medicineId: medicine ? medicine.id : null,
        method: 'scan',
        result: result.status,
        allergyWarning: allergyAlerts.length > 0,
      });

      return result;
    },

    /** Verify the medicine selected from photo candidates. */
    async verifyById({ medicineId, userId = null }) {
      const medicine = await medicineRepository.findById(medicineId);

      if (!medicine) throw AppError.notFound('Medicine not found');

      const allergyAlerts = await allergyService.getAlertsForMedicine(userId, medicine.id);

      const result = buildResult(medicine, allergyAlerts);

      await saveLog({
        userId,
        medicineId: medicine.id,
        method: 'scan',
        result: result.status,
        allergyWarning: allergyAlerts.length > 0,
      });

      return result;
    },

    /** Search medicines by name using batch allergy checks and batch logging. */
    async searchByName({ query, userId = null }) {
      const medicines = await medicineRepository.searchByName(query);

      let alertsByMedicine = new Map();

      if (medicines.length > 0 && userId) {
        if (typeof allergyService.getAlertsForMedicines === 'function') {
          alertsByMedicine = await allergyService.getAlertsForMedicines(
            userId,
            medicines.map((medicine) => medicine.id),
          );
        } else {
          const alertEntries = await Promise.all(
            medicines.map(async (medicine) => [
              medicine.id,
              await allergyService.getAlertsForMedicine(userId, medicine.id),
            ]),
          );

          alertsByMedicine = new Map(alertEntries);
        }
      }

      const results = medicines.map((medicine) => {
        const allergyAlerts = alertsByMedicine.get(medicine.id) || [];

        return buildResult(medicine, allergyAlerts);
      });

      const logEntries = medicines.map((medicine, index) => ({
        userId,
        medicineId: medicine.id,
        method: 'search',
        result: results[index].status,
        allergyWarning: results[index].allergyAlerts.length > 0,
      }));

      if (medicines.length === 0) {
        const result = buildResult(null);

        logEntries.push({
          userId,
          medicineId: null,
          method: 'search',
          result: result.status,
          allergyWarning: false,
        });
      }

      await saveLogs(logEntries);

      return {
        results,
        disclaimer: buildResult(null).disclaimer,
      };
    },
  };
}

module.exports = { createVerificationService };
