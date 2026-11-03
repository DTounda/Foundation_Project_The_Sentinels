/**
 * All SQL for medicines lives here. Always parameterised (?) to prevent SQL injection.
 * Rows are mapped to camelCase objects so the rest of the code never sees column names.
 */

function mapMedicine(row) {
  return {
    id: row.medicine_id,
    name: row.name,
    manufacturer: row.manufacturer,
    registrationNumber: row.registration_number,
    barcode: row.barcode,
    verifiedStatus: row.verified_status,
  };
}

function createMedicineRepository(pool) {
  return {
    /** Indexed lookup (barcode is UNIQUE). Returns null when there is no record. */
    async findByBarcode(barcode) {
      const [rows] = await pool.execute(
        `SELECT medicine_id, name, manufacturer, registration_number, barcode, verified_status
           FROM Medicines WHERE barcode = ? LIMIT 1`,
        [barcode],
      );
      return rows.length ? mapMedicine(rows[0]) : null;
    },

    /** Find medicines whose names contain the search query. */
    async searchByName(query) {
      const [rows] = await pool.execute(
        `SELECT medicine_id, name, manufacturer, registration_number, barcode, verified_status
           FROM Medicines
          WHERE name LIKE ?
          ORDER BY name
          LIMIT 20`,
        [`%${query}%`],
      );
      return rows.map(mapMedicine);
    },

    async findById(id) {
      const [rows] = await pool.execute(
        `SELECT medicine_id, name, manufacturer, registration_number, barcode, verified_status
           FROM Medicines WHERE medicine_id = ? LIMIT 1`,
        [id],
      );
      return rows.length ? mapMedicine(rows[0]) : null;
    },

    /** Ingredients of one medicine (used for allergy matching). */
    async getIngredients(medicineId) {
      const [rows] = await pool.execute(
        `SELECT i.ingredient_id, i.name, mi.strength
           FROM MedicineIngredients mi
           JOIN Ingredients i ON i.ingredient_id = mi.ingredient_id
          WHERE mi.medicine_id = ?`,
        [medicineId],
      );
      return rows.map((r) => ({ id: r.ingredient_id, name: r.name, strength: r.strength }));
    },
  };
}

module.exports = { createMedicineRepository };
