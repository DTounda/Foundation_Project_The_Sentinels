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

function parseReportDescription(value) {
  if (typeof value !== 'string') {
    throw AppError.validation('description is required');
  }

  const description = value.trim();

  if (description.length < 5 || description.length > 1000) {
    throw AppError.validation('description must be between 5 and 1000 characters');
  }

  return description;
}

function parseOptionalLocation(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw AppError.validation('location must be text');
  }

  const location = value.trim();

  if (location.length > 150) {
    throw AppError.validation('location must be 150 characters or fewer');
  }

  return location || null;
}

/** A base64 JPEG, without the "data:image/jpeg;base64," prefix. */
function parsePhoto(value) {
  if (typeof value !== 'string' || value.length < 100) {
    throw AppError.validation('image is required and must be a base64 JPEG');
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
    throw AppError.validation('image must be base64 text only');
  }
  return value;
}

module.exports = {
  parsePhoto,
  parseBarcode,
  parseSearchQuery,
  parsePositiveInt,
  parseEmail,
  parsePassword,
  parseFullName,
  parseSeverity,
  parseReportDescription,
  parseOptionalLocation,
  SEVERITIES,
};
