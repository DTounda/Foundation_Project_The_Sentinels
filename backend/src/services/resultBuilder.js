const { DISCLAIMER, RESULT_MESSAGES } = require('../messages/resultMessages');

const STATUS = Object.freeze({
  VERIFIED: 'verified',
  UNCONFIRMED: 'unconfirmed',
  NOT_FOUND: 'not_found',
});

/**
 * Core rule of MediCheck: we only say "verified" when the record says so.
 * Anything else we cannot stand behind is "unconfirmed" (we never claim a product is fake).
 */
function classifyMedicine(medicine) {
  if (!medicine) return STATUS.NOT_FOUND;
  return medicine.verifiedStatus === 'verified' ? STATUS.VERIFIED : STATUS.UNCONFIRMED;
}

function publicMedicine(medicine) {
  if (!medicine) return null;
  const { id, name, manufacturer, registrationNumber, barcode } = medicine;
  return { id, name, manufacturer, registrationNumber, barcode };
}

/** One result object, used by barcode verification and (for Olivier) by search by name. */
function buildResult(medicine, allergyAlerts = []) {
  const status = classifyMedicine(medicine);
  return {
    status,
    message: RESULT_MESSAGES[status],
    medicine: publicMedicine(medicine),
    allergyAlerts,
    disclaimer: DISCLAIMER,
  };
}

module.exports = { STATUS, classifyMedicine, buildResult };
