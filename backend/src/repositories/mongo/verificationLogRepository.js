
const { nextId } = require('../counters');

function createMongoVerificationLogRepository(db) {
  const verificationLogs = db.collection('VerificationLogs');

  return {
    /** Save a verification check, including anonymous checks. */
    async create({
      userId = null,
      medicineId = null,
      method,
      result,
      allergyWarning = false,
    }) {
      const id = await nextId(db, 'verificationLogs');

      await verificationLogs.insertOne({
        id,
        userId: userId === null ? null : Number(userId),
        medicineId: medicineId === null ? null : Number(medicineId),
        method,
        result,
        allergyWarning: Boolean(allergyWarning),
        createdAt: new Date(),
      });

      return id;
    },
  };
}

module.exports = { createMongoVerificationLogRepository };
