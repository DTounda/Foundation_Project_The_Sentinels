function createReportRepository(pool) {
  return {
    async create({ userId = null, medicineId = null, description, location = null }) {
      const [result] = await pool.execute(
        `INSERT INTO SuspiciousReports
          (user_id, medicine_id, description, location, status, reported_at)
         VALUES (?, ?, ?, ?, 'new', NOW())`,
        [userId, medicineId, description, location],
      );

      return {
        id: result.insertId,
        status: 'new',
      };
    },
  };
}

module.exports = { createReportRepository };
