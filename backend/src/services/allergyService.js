const AppError = require('../utils/AppError');
const { allergyMessage } = require('../messages/resultMessages');

const SEVERITY_ORDER = { severe: 0, moderate: 1, mild: 2 };

/**
 * Core allergy algorithm: intersect the ingredients of a medicine with the user's allergies.
 * Matching is by ingredient id (set lookup, O(n + m)), never by free text.
 * Most severe alerts come first. Pure function, easy to unit test.
 */
function findAllergyMatches(medicineIngredients, userAllergies) {
  const allergyByIngredient = new Map(userAllergies.map((a) => [a.ingredientId, a]));
  return medicineIngredients
    .filter((ing) => allergyByIngredient.has(ing.id))
    .map((ing) => {
      const allergy = allergyByIngredient.get(ing.id);
      return {
        ingredientId: ing.id,
        ingredient: ing.name,
        severity: allergy.severity,
        message: allergyMessage(ing.name),
      };
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function createAllergyService({ medicineRepository, ingredientRepository, userAllergyRepository }) {
  return {
    /** Alerts for one medicine and one user. No user (anonymous) means no alerts. */
    async getAlertsForMedicine(userId, medicineId) {
      if (!userId || !medicineId) return [];
      const allergies = await userAllergyRepository.listByUser(userId);
      if (allergies.length === 0) return [];
      const ingredients = await medicineRepository.getIngredients(medicineId);
      return findAllergyMatches(ingredients, allergies);
    },

    async checkMedicine(userId, medicineId) {
      const medicine = await medicineRepository.findById(medicineId);
      if (!medicine) throw AppError.notFound('Medicine not found');
      const allergyAlerts = await this.getAlertsForMedicine(userId, medicineId);
      return { medicineId, hasAlert: allergyAlerts.length > 0, allergyAlerts };
    },

    listIngredients(query) {
      return ingredientRepository.list(query);
    },

    listAllergies(userId) {
      return userAllergyRepository.listByUser(userId);
    },

    async addAllergy(userId, ingredientId, severity) {
      const ingredient = await ingredientRepository.findById(ingredientId);
      if (!ingredient) throw AppError.notFound('Ingredient not found');
      if (await userAllergyRepository.findByUserAndIngredient(userId, ingredientId)) {
        throw AppError.conflict(`${ingredient.name} is already in your allergy list`);
      }
      const id = await userAllergyRepository.add(userId, ingredientId, severity);
      return { id, ingredientId, ingredient: ingredient.name, severity };
    },

    async removeAllergy(userId, allergyId) {
      const removed = await userAllergyRepository.remove(userId, allergyId);
      if (!removed) throw AppError.notFound('Allergy not found');
    },
  };
}

module.exports = { createAllergyService, findAllergyMatches };
