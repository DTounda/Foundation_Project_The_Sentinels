const AppError = require('./AppError');

const BARCODE_PATTERN = /^[A-Za-z0-9-]{4,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEVERITIES = ['mild', 'moderate', 'severe'];

/** Barcodes are strings (a JSON number would lose leading zeros). */
function parseBarcode(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw AppError.validation('barcode is required and must be a string');
  }
  const barcode = value.trim();
  if (!BARCODE_PATTERN.test(barcode)) {
    throw AppError.validation('barcode must be 4 to 50 letters, digits or dashes');
  }
  return barcode;
}

/** Validate a medicine search query. */
function parseSearchQuery(value) {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw AppError.validation('search query must be at least 2 characters');
  }
  return value.trim();
}

/** Accepts 12, "12"; rejects 0, -1, 1.5, "abc". */
function parsePositiveInt(value, fieldName) {
  const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw AppError.validation(`${fieldName} must be a positive whole number`);
  }
  return n;
}

function parseEmail(value) {
  if (typeof value !== 'string') throw AppError.validation('email is required');
  const email = value.trim().toLowerCase();
  if (email.length > 150 || !EMAIL_PATTERN.test(email)) {
    throw AppError.validation('email is not valid');
  }
  return email;
}

function parsePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw AppError.validation('password must be between 8 and 72 characters');
  }
  return value;
}

function parseFullName(value) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
    throw AppError.validation('fullName must be between 2 and 100 characters');
  }
  return value.trim();
}

function parseSeverity(value) {
  if (!SEVERITIES.includes(value)) {
    throw AppError.validation(`severity must be one of: ${SEVERITIES.join(', ')}`);
  }
  return value;
}

module.exports = {
  parseBarcode,
  parseSearchQuery,
  parsePositiveInt,
  parseEmail,
  parsePassword,
  parseFullName,
  parseSeverity,
  SEVERITIES,
};
