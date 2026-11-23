const { findCandidates } = require('./photoMatcher');

// A medication a user types is free text ("Panadol", "my blood pressure pill"),
// so we fuzzy-match it to one of our medicines the same way the photo feature
// matches OCR text: never a single guess, just the best candidate above a
// confidence floor. Below that floor we say nothing rather than guess wrong.
const MATCH_THRESHOLD = 0.6;

/**
 * Resolves the user's free-text medications to medicines we know, each with
 * its own ingredients, skipping the medicine currently being checked (no
 * point reporting that a medicine "interacts with itself").
 */
async function resolveUserMedications({ medications, medicineRepository, excludeMedicineId }) {
  if (medications.length === 0) return [];

  const allMedicines = await medicineRepository.listForMatching();
  const matched = [];

  for (const medication of medications) {
    const [best] = findCandidates(medication.name, allMedicines, {
      limit: 1,
      threshold: MATCH_THRESHOLD,
    });

    if (best && best.medicineId !== Number(excludeMedicineId)) {
      matched.push({ medicationName: medication.name, medicineId: best.medicineId });
    }
  }

  return matched;
}

function createInteractionService({
  medicineRepository,
  userMedicationRepository,
  interactionRepository,
}) {
  return {
    // Finds Major and Moderate interactions between this medicine and the medicines the user takes.
    async getInteractions(medicineId, userId) {
      const targetMap = await medicineRepository.getIngredientsForMedicines([medicineId]);
      const targetIngredients = targetMap.get(Number(medicineId)) || [];
      if (targetIngredients.length === 0) return [];

      const medications = await userMedicationRepository.listByUser(userId);
      const matched = await resolveUserMedications({
        medications,
        medicineRepository,
        excludeMedicineId: medicineId,
      });
      if (matched.length === 0) return [];

      const otherMedicineIds = [...new Set(matched.map((m) => m.medicineId))];
      const otherIngredientsByMedicine =
        await medicineRepository.getIngredientsForMedicines(otherMedicineIds);

      const targetIngredientIds = targetIngredients.map((ingredient) => ingredient.id);
      const targetNameById = new Map(
        targetIngredients.map((ingredient) => [ingredient.id, ingredient.name]),
      );

      const results = [];

      for (const { medicationName, medicineId: otherMedicineId } of matched) {
        const otherIngredients = otherIngredientsByMedicine.get(otherMedicineId) || [];
        if (otherIngredients.length === 0) continue;

        const otherIngredientIds = otherIngredients.map((ingredient) => ingredient.id);
        const otherNameById = new Map(
          otherIngredients.map((ingredient) => [ingredient.id, ingredient.name]),
        );

        const pairs = await interactionRepository.findBetweenIngredientSets(
          targetIngredientIds,
          otherIngredientIds,
        );

        for (const pair of pairs) {
          const targetIsA = targetNameById.has(pair.ingredientIdA);
          const targetIngredientId = targetIsA ? pair.ingredientIdA : pair.ingredientIdB;
          const otherIngredientId = targetIsA ? pair.ingredientIdB : pair.ingredientIdA;

          const ingredient = targetNameById.get(targetIngredientId);
          const withIngredient = otherNameById.get(otherIngredientId);
          if (!ingredient || !withIngredient) continue;

          results.push({
            withMedicationName: medicationName,
            ingredient,
            withIngredient,
            level: pair.level,
          });
        }
      }

      return results;
    },
  };
}

module.exports = { createInteractionService };
