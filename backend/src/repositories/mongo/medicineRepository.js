
function mapMedicine(document) {
  if (!document) return null;

  return {
    id: document.medicineId,
    name: document.brandName || document.genericName,
    manufacturer: document.manufacturer,
    registrationNumber: document.registrationNumber,
    barcode: document.barcode ?? null,
    verifiedStatus: document.verifiedStatus ?? null,
  };
}

function createMongoMedicineRepository(db) {
  const medicines = db.collection('Medicines');

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
            { brandName: searchPattern },
            { genericName: searchPattern },
          ],
        })
        .sort({ brandName: 1 })
        .limit(20)
        .toArray();

      return documents.map(mapMedicine);
    },

    async findById(id) {
      const document = await medicines.findOne({
        medicineId: Number(id),
      });

      return mapMedicine(document);
    },

    async getIngredients(medicineId) {
      const document = await medicines.findOne(
        { medicineId: Number(medicineId) },
        { projection: { ingredients: 1 } },
      );

      if (!document || !Array.isArray(document.ingredients)) {
        return [];
      }

      return document.ingredients.map(ingredient => ({
        id: ingredient.ingredientId,
        name: ingredient.name,
        strength: ingredient.strength ?? null,
      }));
    },

    async listForMatching() {
      const documents = await medicines
        .find(
          {},
          {
            projection: {
              medicineId: 1,
              brandName: 1,
              genericName: 1,
              manufacturer: 1,
            },
          },
        )
        .sort({ brandName: 1 })
        .toArray();

      return documents.map(document => ({
        id: document.medicineId,
        name: document.brandName || document.genericName,
        genericName: document.genericName,
        manufacturer: document.manufacturer,
      }));
    },
  };
}

module.exports = { createMongoMedicineRepository };
