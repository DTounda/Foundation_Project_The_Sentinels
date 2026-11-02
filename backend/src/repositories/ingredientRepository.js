function createIngredientRepository(pool) {
  return {
    async findById(id) {
      const [rows] = await pool.execute(
        'SELECT ingredient_id, name FROM Ingredients WHERE ingredient_id = ? LIMIT 1',
        [id],
      );
      return rows.length ? { id: rows[0].ingredient_id, name: rows[0].name } : null;
    },

    /** Used by the allergy picker. `query` is optional; LIKE value is bound, never concatenated. */
    async list(query = '') {
      const [rows] = await pool.execute(
        `SELECT ingredient_id, name FROM Ingredients
          WHERE name LIKE ? ORDER BY name LIMIT 100`,
        [`%${query.replace(/[%_\\]/g, '\\$&')}%`],
      );
      return rows.map((r) => ({ id: r.ingredient_id, name: r.name }));
    },
  };
}

module.exports = { createIngredientRepository };
