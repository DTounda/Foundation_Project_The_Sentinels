function mapAllergy(row) {
  return {
    id: row.user_allergy_id,
    ingredientId: row.ingredient_id,
    ingredient: row.name,
    severity: row.severity,
  };
}

/** Every query filters by user_id: allergy data is sensitive health data, owner access only. */
function createUserAllergyRepository(pool) {
  return {
    async listByUser(userId) {
      const [rows] = await pool.execute(
        `SELECT ua.user_allergy_id, ua.ingredient_id, i.name, ua.severity
           FROM UserAllergies ua
           JOIN Ingredients i ON i.ingredient_id = ua.ingredient_id
          WHERE ua.user_id = ?
          ORDER BY i.name`,
        [userId],
      );
      return rows.map(mapAllergy);
    },

    async findByUserAndIngredient(userId, ingredientId) {
      const [rows] = await pool.execute(
        `SELECT ua.user_allergy_id, ua.ingredient_id, i.name, ua.severity
           FROM UserAllergies ua
           JOIN Ingredients i ON i.ingredient_id = ua.ingredient_id
          WHERE ua.user_id = ? AND ua.ingredient_id = ? LIMIT 1`,
        [userId, ingredientId],
      );
      return rows.length ? mapAllergy(rows[0]) : null;
    },

    async add(userId, ingredientId, severity) {
      const [res] = await pool.execute(
        'INSERT INTO UserAllergies (user_id, ingredient_id, severity) VALUES (?, ?, ?)',
        [userId, ingredientId, severity],
      );
      return res.insertId;
    },

    /** Returns true if a row of THIS user was deleted. */
    async remove(userId, allergyId) {
      const [res] = await pool.execute(
        'DELETE FROM UserAllergies WHERE user_allergy_id = ? AND user_id = ?',
        [allergyId, userId],
      );
      return res.affectedRows > 0;
    },
  };
}

module.exports = { createUserAllergyRepository };
