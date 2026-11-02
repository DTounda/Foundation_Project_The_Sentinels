const mysql = require('mysql2/promise');
const config = require('./env');

let pool;

/** Lazily create one shared connection pool. */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...config.db,
      waitForConnections: true,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

/** Returns true when MySQL answers a trivial query. Used by the health check. */
async function checkDatabase() {
  try {
    await getPool().query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { getPool, checkDatabase, closePool };
