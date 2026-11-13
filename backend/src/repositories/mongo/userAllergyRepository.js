const AppError = require('../../utils/AppError');
const { nextId } = require('../counters');

function createMongoUserAllergyRepository(db) {
  const userAllergies = db.collection('UserAllergies');
  const ingredients = db.collection('Ingredients');

  return {
    async listByUser(userId) {
      const allergies = await userAllergies.find({ userId: Number(userId) }).toArray();

      return allergies
        .map((allergy) => ({
          id: allergy.allergyId,
          ingredientId: allergy.ingredientId,
          ingredient: allergy.ingredientName,
          severity: allergy.severity,
        }))
        .sort((a, b) => (a.ingredient || '').localeCompare(b.ingredient || ''));
    },

    async findByUserAndIngredient(userId, ingredientId) {
      const allergy = await userAllergies.findOne({
        userId: Number(userId),
        ingredientId: Number(ingredientId),
      });

      if (!allergy) return null;

      return {
        id: allergy.allergyId,
        ingredientId: allergy.ingredientId,
        ingredient: allergy.ingredientName,
        severity: allergy.severity,
      };
    },

    async add(userId, ingredientId, severity) {
      const numericUserId = Number(userId);
      const numericIngredientId = Number(ingredientId);

      const ingredient = await ingredients.findOne({
        ingredientId: numericIngredientId,
      });

      if (!ingredient) {
        throw AppError.notFound('Ingredient not found');
      }

      try {
        const allergyId = await nextId(db, 'userAllergies');

        await userAllergies.insertOne({
          allergyId,
          userId: numericUserId,
          ingredientId: numericIngredientId,
          ingredientName: ingredient.name,
          severity,
          createdAt: new Date(),
        });

        return allergyId;
      } catch (err) {
        if (err.code === 11000) {
          throw AppError.conflict('This ingredient is already in your allergy list');
        }

        throw err;
      }
    },

    async remove(userId, allergyId) {
      const result = await userAllergies.deleteOne({
        allergyId: Number(allergyId),
        userId: Number(userId),
      });

      return result.deletedCount > 0;
    },
  };
}

module.exports = { createMongoUserAllergyRepository };
