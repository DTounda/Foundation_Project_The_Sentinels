const db = require("../config/db");

async function searchMedicineByName(name) {
  const searchTerm = `%${name}%`;

  const [rows] = await db.query(
    `SELECT DISTINCT m.*
     FROM Medicines m
     LEFT JOIN MedicineIngredients mi
       ON mi.medicine_id = m.medicine_id
     LEFT JOIN Ingredients i
       ON i.ingredient_id = mi.ingredient_id
     WHERE m.brand_name LIKE ?
        OR m.generic_name LIKE ?
        OR i.name LIKE ?
        OR m.registration_number LIKE ?`,
    [searchTerm, searchTerm, searchTerm, searchTerm]
  );

  return rows;
}

module.exports = { searchMedicineByName };