
const AppError = require('../utils/AppError');
const { allergyMessage } = require('../messages/resultMessages');

const SEVERITY_ORDER = { severe: 0, moderate: 1, mild: 2 };

function findAllergyMatches(medicineIngredients, userAllergies) {
  const allergyByIngredient = new Map(
    userAllergies.map(allergy => [Number(allergy.ingredientId), allergy]),
  );

  return medicineIngredients
    .filter(ingredient => allergyByIngredient.has(Number(ingredient.id)))
    .map(ingredient => {
      const allergy = allergyByIngredient.get(Number(ingredient.id));

      return {
        ingredientId: ingredient.id,
        ingredient: ingredient.name,
        severity: allergy.severity,
        message: allergyMessage(ingredient.name),
      };
    })
    .sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
}

function createAllergyService({
  medicineRepository,
  ingredientRepository,
  userAllergyRepository,
}) {
  return {
    async getAlertsForMedicine(userId, medicineId) {
      if (!userId || !medicineId) return [];

      const allergies = await userAllergyRepository.listByUser(userId);

      if (allergies.length === 0) return [];

      const ingredients = await medicineRepository.getIngredients(medicineId);

      return findAllergyMatches(ingredients, allergies);
    },

    /**
     * Get allergy alerts for several medicines using batch ingredient retrieval.
     */
    async getAlertsForMedicines(userId, medicineIds) {
      if (!userId || !medicineIds || medicineIds.length === 0) {
        return new Map();
      }

      const allergies = await userAllergyRepository.listByUser(userId);

      const results = new Map(
        medicineIds.map(id => [Number(id), []]),
      );

      if (allergies.length === 0) return results;

      const ingredientsByMedicine =
        await medicineRepository.getIngredientsForMedicines(medicineIds);

      for (const medicineId of medicineIds) {
        const ingredients = ingredientsByMedicine.get(Number(medicineId)) || [];

        results.set(
          Number(medicineId),
          findAllergyMatches(ingredients, allergies),
        );
      }

      return results;
    },

    async checkMedicine(userId, medicineId) {
      const medicine = await medicineRepository.findById(medicineId);

      if (!medicine) throw AppError.notFound('Medicine not found');

      const allergyAlerts = await this.getAlertsForMedicine(userId, medicineId);

      return {
        medicineId,
        hasAlert: allergyAlerts.length > 0,
        allergyAlerts,
      };
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
        throw AppError.conflict(
          `${ingredient.name} is already in your allergy list`,
        );
      }

      const id = await userAllergyRepository.add(userId, ingredientId, severity);

      return {
        id,
        ingredientId,
        ingredient: ingredient.name,
        severity,
      };
    },

    async removeAllergy(userId, allergyId) {
      const removed = await userAllergyRepository.remove(userId, allergyId);

      if (!removed) throw AppError.notFound('Allergy not found');
    },
  };
}

module.exports = { createAllergyService, findAllergyMatches };
