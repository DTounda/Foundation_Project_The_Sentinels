
function createMongoIngredientRepository(db) {
  const ingredients = db.collection('Ingredients');

  return {
    /** Find one ingredient by its numeric API ID. */
    async findById(id) {
      const document = await ingredients.findOne({
        id: Number(id),
      });

      if (!document) return null;

      return {
        id: document.id,
        name: document.name,
      };
    },

    /** Search ingredients by name, returning at most 100. */
    async list(query = '') {
      const escapedQuery = String(query).trim().replace(
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
        id: document.id,
        name: document.name,
      }));
    },
  };
}

module.exports = { createMongoIngredientRepository };
