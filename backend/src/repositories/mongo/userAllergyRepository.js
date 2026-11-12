
const AppError = require('../../utils/AppError');
const { nextId } = require('../counters');

function createMongoUserAllergyRepository(db) {
  const userAllergies = db.collection('UserAllergies');
  const ingredients = db.collection('Ingredients');

  return {
    /** List only the allergies belonging to this user. */
    async listByUser(userId) {
      const allergies = await userAllergies
        .find({ userId: Number(userId) })
        .toArray();

      if (allergies.length === 0) return [];

      const ingredientIds = allergies.map(
        allergy => allergy.ingredientId,
      );

      const ingredientDocuments = await ingredients
        .find({ id: { $in: ingredientIds } })
        .toArray();

      const ingredientById = new Map(
        ingredientDocuments.map(ingredient => [
          ingredient.id,
          ingredient.name,
        ]),
      );

      return allergies
        .map(allergy => ({
          id: allergy.id,
          ingredientId: allergy.ingredientId,
          ingredient: ingredientById.get(allergy.ingredientId) || null,
          severity: allergy.severity,
        }))
        .sort((a, b) =>
          (a.ingredient || '').localeCompare(b.ingredient || ''),
        );
    },

    /** Find an allergy only within the specified user's records. */
    async findByUserAndIngredient(userId, ingredientId) {
      const allergy = await userAllergies.findOne({
        userId: Number(userId),
        ingredientId: Number(ingredientId),
      });

      if (!allergy) return null;

      const ingredient = await ingredients.findOne({
        id: allergy.ingredientId,
      });

      return {
        id: allergy.id,
        ingredientId: allergy.ingredientId,
        ingredient: ingredient ? ingredient.name : null,
        severity: allergy.severity,
      };
    },

    /** Add an allergy with a shared numeric ID. */
    async add(userId, ingredientId, severity) {
      const numericUserId = Number(userId);
      const numericIngredientId = Number(ingredientId);

      try {
        const id = await nextId(db, 'userAllergies');

        await userAllergies.insertOne({
          id,
          userId: numericUserId,
          ingredientId: numericIngredientId,
          severity,
          createdAt: new Date(),
        });

        return id;
      } catch (err) {
        if (err.code === 11000) {
          throw AppError.conflict(
            'This ingredient is already in your allergy list',
          );
        }

        throw err;
      }
    },

    /** Delete only an allergy owned by the specified user. */
    async remove(userId, allergyId) {
      const result = await userAllergies.deleteOne({
        id: Number(allergyId),
        userId: Number(userId),
      });

      return result.deletedCount > 0;
    },
  };
}

module.exports = { createMongoUserAllergyRepository };
