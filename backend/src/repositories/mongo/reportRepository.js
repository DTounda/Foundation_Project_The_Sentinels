
const { nextId } = require('../counters');

function createMongoReportRepository(db) {
  const reports = db.collection('SuspiciousReports');

  return {
    async create({
      userId = null,
      medicineId = null,
      description,
      location = null,
    }) {
      const id = await nextId(db, 'suspiciousReports');

      await reports.insertOne({
        id,
        userId: userId === null ? null : Number(userId),
        medicineId: medicineId === null ? null : Number(medicineId),
        description,
        location,
        status: 'new',
        createdAt: new Date(),
      });

      return {
        id,
        status: 'new',
      };
    },
  };
}

module.exports = { createMongoReportRepository };
