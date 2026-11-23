const AppError = require('../utils/AppError');
const { DISCLAIMER } = require('../messages/resultMessages');
const { findCandidates } = require('./photoMatcher');
const OCR_UNAVAILABLE = 'Photo reading is unavailable right now. Please search by name.';

const UNREADABLE = 'We could not read the medicine name. Please take the photo again.';

// How long the medicine list is cached in memory before a fresh load is
// tried. This list barely changes between imports, but every photo check
// used to re-fetch all ~2,500 medicines from Atlas, which is most of why
// the photo flow felt slow.
const DEFAULT_CACHE_MS = 60 * 60 * 1000; // 1 hour

/** Photo of a box -> text -> ranked candidates. The photo is never stored. */
function createPhotoService({
  ocrService,
  medicineRepository,
  logger = console,
  cacheMs = DEFAULT_CACHE_MS,
}) {
  let cache = { medicines: null, loadedAt: 0 };

  // Returns the medicine list for photo matching, reloading it from the database at most once an hour.
  async function getMedicinesForMatching() {
    const isStale = !cache.medicines || Date.now() - cache.loadedAt > cacheMs;
    if (!isStale) return cache.medicines;

    try {
      const fresh = await medicineRepository.listForMatching();
      cache = { medicines: fresh, loadedAt: Date.now() };
    } catch (err) {
      // If we have nothing cached yet, there's nothing to fall back to.
      if (!cache.medicines) throw err;
      // Otherwise a blip in the DB shouldn't break photo checks that were
      // working fine a minute ago — keep serving the stale list.
      logger.error('Could not refresh medicine cache, serving stale list:', err.message);
    }

    return cache.medicines;
  }

  return {
    // Reads the text on the photo with OCR, then returns the closest registered medicines for the user to choose from.
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

      const medicines = await getMedicinesForMatching();
      const candidates = findCandidates(text, medicines);
      if (candidates.length === 0) throw AppError.unreadable(UNREADABLE);

      return { candidates, disclaimer: DISCLAIMER };
    },
  };
}

module.exports = { createPhotoService };
