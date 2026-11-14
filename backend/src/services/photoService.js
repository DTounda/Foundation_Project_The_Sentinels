const AppError = require('../utils/AppError');
const { DISCLAIMER } = require('../messages/resultMessages');
const { findCandidates } = require('./photoMatcher');
const OCR_UNAVAILABLE = 'Photo reading is unavailable right now. Please search by name.';

const UNREADABLE = 'We could not read the medicine name. Please take the photo again.';

/** Photo of a box -> text -> ranked candidates. The photo is never stored. */
function createPhotoService({ ocrService, medicineRepository, logger = console }) {
  return {
    async verifyPhoto(image) {
      let text;
      try {
        text = await ocrService.readText(image);
      } catch (err) {
        // Wrong key, no internet or free quota used up: the user can still search by name.
        logger.error('OCR service failed:', err.message);
        throw AppError.unavailable(OCR_UNAVAILABLE);
      }
      if (!text) throw AppError.unreadable(UNREADABLE);

      const medicines = await medicineRepository.listForMatching();
      const candidates = findCandidates(text, medicines);
      if (candidates.length === 0) throw AppError.unreadable(UNREADABLE);

      return { candidates, disclaimer: DISCLAIMER };
    },
  };
}

module.exports = { createPhotoService };
