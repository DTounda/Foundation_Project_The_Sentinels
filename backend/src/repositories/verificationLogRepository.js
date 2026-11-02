function createVerificationLogRepository(pool) {
  return {
    /** Saves one check. userId and medicineId may be null (anonymous check / unknown medicine). */
    async create({ userId = null, medicineId = null, method, result, allergyWarning = false }) {
      const [res] = await pool.execute(
        `INSERT INTO VerificationLogs (user_id, medicine_id, method, result, allergy_warning, checked_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, medicineId, method, result, allergyWarning ? 1 : 0],
      );
      return res.insertId;
    },
  };
}

module.exports = { createVerificationLogRepository };
