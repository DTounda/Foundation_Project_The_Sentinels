function mapUser(row) {
  return {
    id: row.user_id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
  };
}

function createUserRepository(pool) {
  return {
    async findByEmail(email) {
      const [rows] = await pool.execute(
        `SELECT user_id, full_name, email, password_hash, role
           FROM Users WHERE email = ? LIMIT 1`,
        [email],
      );
      return rows.length ? mapUser(rows[0]) : null;
    },

    async findById(id) {
      const [rows] = await pool.execute(
        `SELECT user_id, full_name, email, password_hash, role
           FROM Users WHERE user_id = ? LIMIT 1`,
        [id],
      );
      return rows.length ? mapUser(rows[0]) : null;
    },

    /** The role is always 'user' here. Pharmacists/admins are promoted directly in the database. */
    async create({ fullName, email, passwordHash }) {
      const [res] = await pool.execute(
        `INSERT INTO Users (full_name, email, password_hash, role, created_at)
         VALUES (?, ?, ?, 'user', NOW())`,
        [fullName, email, passwordHash],
      );
      return { id: res.insertId, fullName, email, role: 'user' };
    },
  };
}

module.exports = { createUserRepository };
