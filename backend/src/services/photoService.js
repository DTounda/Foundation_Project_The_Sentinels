const AppError = require('../utils/AppError');
const { DISCLAIMER } = require('../messages/resultMessages');
const { findCandidates } = require('./photoMatcher');

const UNREADABLE = 'We could not read the medicine name. Please take the photo again.';

/** Photo of a box -> text -> ranked candidates. The photo is never stored. */
function createPhotoService({ ocrService, medicineRepository }) {
  return {
    async verifyPhoto(image) {
      const text = await ocrService.readText(image);
      if (!text) throw AppError.unreadable(UNREADABLE);

      const medicines = await medicineRepository.listForMatching();
      const candidates = findCandidates(text, medicines);
      if (candidates.length === 0) throw AppError.unreadable(UNREADABLE);

      return { candidates, disclaimer: DISCLAIMER };
    },
  };
}

module.exports = { createPhotoService };
