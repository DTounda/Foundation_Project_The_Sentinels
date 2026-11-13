const { nextId, nextIds } = require('../counters');

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

    /** Save many checks with 1 id query + 1 insert, instead of 2 queries per log. */
    async createMany(entries) {
      if (!entries || entries.length === 0) {
        return [];
      }

      const ids = await nextIds(db, 'verificationLogs', entries.length);

      await verificationLogs.insertMany(
        entries.map((entry, index) => {
          const userId = entry.userId ?? null;
          const medicineId = entry.medicineId ?? null;

          return {
            id: ids[index],
            userId: userId === null ? null : Number(userId),
            medicineId: medicineId === null ? null : Number(medicineId),
            method: entry.method,
            result: entry.result,
            allergyWarning: Boolean(entry.allergyWarning),
            createdAt: new Date(),
          };
        }),
      );

      return ids;
    },
  };
}

module.exports = { createMongoVerificationLogRepository };
