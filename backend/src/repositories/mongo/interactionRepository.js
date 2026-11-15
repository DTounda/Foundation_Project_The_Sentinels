function createMongoInteractionRepository(db) {
  const interactions = db.collection('Interactions');

  return {
    /**
     * Pairs where one ingredient is in `idsA` and the other is in `idsB`
     * (in either direction, since a pair can be stored in either order).
     */
    async findBetweenIngredientSets(idsA, idsB) {
      const a = [...new Set((idsA || []).map(Number).filter(Number.isFinite))];
      const b = [...new Set((idsB || []).map(Number).filter(Number.isFinite))];

      if (a.length === 0 || b.length === 0) return [];

      const documents = await interactions
        .find({
          $or: [
            { ingredientIdA: { $in: a }, ingredientIdB: { $in: b } },
            { ingredientIdA: { $in: b }, ingredientIdB: { $in: a } },
          ],
        })
        .toArray();

      return documents.map((document) => ({
        ingredientIdA: document.ingredientIdA,
        ingredientIdB: document.ingredientIdB,
        level: document.level,
      }));
    },
  };
}

module.exports = { createMongoInteractionRepository };
