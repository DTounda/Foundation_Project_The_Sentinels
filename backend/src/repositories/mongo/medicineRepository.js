
function mapMedicine(document) {
  if (!document) return null;

  return {
    id: document.id,
    name: document.name || document.brandName || document.genericName,
    manufacturer: document.manufacturer,
    registrationNumber: document.registrationNumber,
    barcode: document.barcode ?? null,
    verifiedStatus: document.verifiedStatus ?? null,
  };
}

function createMongoMedicineRepository(db) {
  const medicines = db.collection('Medicines');
  const medicineIngredients = db.collection('MedicineIngredients');
  const ingredients = db.collection('Ingredients');

  return {
    async findByBarcode(barcode) {
      const document = await medicines.findOne({ barcode });
      return mapMedicine(document);
    },

    async searchByName(query) {
      const escapedQuery = String(query || '').trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      if (!escapedQuery) return [];

      const searchPattern = new RegExp(escapedQuery, 'i');

      const documents = await medicines
        .find({
          $or: [
            { name: searchPattern },
            { brandName: searchPattern },
            { genericName: searchPattern },
          ],
        })
        .sort({ name: 1, brandName: 1 })
        .limit(20)
        .toArray();

      return documents.map(mapMedicine);
    },

    async findById(id) {
      const document = await medicines.findOne({ id: Number(id) });
      return mapMedicine(document);
    },

    async getIngredients(medicineId) {
      const links = await medicineIngredients
        .find({ medicineId: Number(medicineId) })
        .toArray();

      if (links.length === 0) return [];

      const ingredientIds = links.map(link => link.ingredientId);

      const ingredientDocuments = await ingredients
        .find({ id: { $in: ingredientIds } })
        .toArray();

      const ingredientById = new Map(
        ingredientDocuments.map(ingredient => [
          ingredient.id,
          ingredient,
        ]),
      );

      return links
        .map(link => {
          const ingredient = ingredientById.get(link.ingredientId);

          if (!ingredient) return null;

          return {
            id: ingredient.id,
            name: ingredient.name,
            strength: link.strength ?? null,
          };
        })
        .filter(Boolean);
    },
  };
}

module.exports = { createMongoMedicineRepository };
