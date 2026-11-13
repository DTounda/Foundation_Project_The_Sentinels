
function createMongoIngredientRepository(db) {
  const ingredients = db.collection('Ingredients');

  return {
    async findById(id) {
      const document = await ingredients.findOne({
        ingredientId: Number(id),
      });

      if (!document) return null;

      return {
        id: document.ingredientId,
        name: document.name,
      };
    },

    async list(query = '') {
      const escapedQuery = String(query || '').trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      const filter = escapedQuery
        ? { name: { $regex: escapedQuery, $options: 'i' } }
        : {};

      const documents = await ingredients
        .find(filter)
        .sort({ name: 1 })
        .limit(100)
        .toArray();

      return documents.map(document => ({
        id: document.ingredientId,
        name: document.name,
      }));
    },
  };
}

module.exports = { createMongoIngredientRepository };
