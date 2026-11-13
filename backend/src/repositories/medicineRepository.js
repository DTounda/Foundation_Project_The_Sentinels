
/**
 * All SQL for medicines lives here.
 * Queries are parameterised to prevent SQL injection.
 * Rows are mapped to camelCase objects.
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
    async findByBarcode(barcode) {
      const [rows] = await pool.execute(
        `SELECT medicine_id, name, manufacturer, registration_number, barcode, verified_status
           FROM Medicines
          WHERE barcode = ?
          LIMIT 1`,
        [barcode],
      );

      return rows.length ? mapMedicine(rows[0]) : null;
    },

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

    async listForMatching() {
      const [rows] = await pool.execute(
        'SELECT medicine_id, name, manufacturer FROM Medicines',
      );

      return rows.map(row => ({
        id: row.medicine_id,
        name: row.name,
        manufacturer: row.manufacturer,
      }));
    },

    async findById(id) {
      const [rows] = await pool.execute(
        `SELECT medicine_id, name, manufacturer, registration_number, barcode, verified_status
           FROM Medicines
          WHERE medicine_id = ?
          LIMIT 1`,
        [id],
      );

      return rows.length ? mapMedicine(rows[0]) : null;
    },

    async getIngredients(medicineId) {
      const [rows] = await pool.execute(
        `SELECT i.ingredient_id, i.name, mi.strength
           FROM MedicineIngredients mi
           JOIN Ingredients i ON i.ingredient_id = mi.ingredient_id
          WHERE mi.medicine_id = ?`,
        [medicineId],
      );

      return rows.map(row => ({
        id: row.ingredient_id,
        name: row.name,
        strength: row.strength,
      }));
    },

    /**
     * Retrieve ingredients for multiple medicines in one database query.
     * Returns a Map: medicineId -> ingredients array.
     */
    async getIngredientsForMedicines(medicineIds) {
      const ids = [...new Set(
        (medicineIds || [])
          .map(Number)
          .filter(Number.isFinite),
      )];

      if (ids.length === 0) return new Map();

      const placeholders = ids.map(() => '?').join(', ');

      const [rows] = await pool.execute(
        `SELECT mi.medicine_id, i.ingredient_id, i.name, mi.strength
           FROM MedicineIngredients mi
           JOIN Ingredients i ON i.ingredient_id = mi.ingredient_id
          WHERE mi.medicine_id IN (${placeholders})`,
        ids,
      );

      const result = new Map(ids.map(id => [id, []]));

      for (const row of rows) {
        result.get(row.medicine_id).push({
          id: row.ingredient_id,
          name: row.name,
          strength: row.strength,
        });
      }

      return result;
    },
  };
}

module.exports = { createMedicineRepository };
