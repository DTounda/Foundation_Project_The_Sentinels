const { nextId } = require('../counters');

function mapMedication(document) {
  if (!document) return null;

  return { id: document.medicationId, name: document.name };
}

function createMongoUserMedicationRepository(db) {
  const medications = db.collection('userMedications');

  return {
    async listByUser(userId) {
      const documents = await medications
        .find({ userId: Number(userId) })
        .sort({ medicationId: 1 })
        .toArray();
      return documents.map(mapMedication);
    },

    async findByUser(userId, medicationId) {
      const document = await medications.findOne({
        userId: Number(userId),
        medicationId: Number(medicationId),
      });
      return mapMedication(document);
    },

    async create(userId, name) {
      const medicationId = await nextId(db, 'userMedications');
      await medications.insertOne({ medicationId, userId: Number(userId), name });
      return { id: medicationId, name };
    },

    async update(userId, medicationId, name) {
      const result = await medications.findOneAndUpdate(
        { userId: Number(userId), medicationId: Number(medicationId) },
        { $set: { name } },
        { returnDocument: 'after' },
      );
      return mapMedication(result);
    },

    async remove(userId, medicationId) {
      const result = await medications.deleteOne({
        userId: Number(userId),
        medicationId: Number(medicationId),
      });
      return result.deletedCount === 1;
    },
  };
}

module.exports = { createMongoUserMedicationRepository };