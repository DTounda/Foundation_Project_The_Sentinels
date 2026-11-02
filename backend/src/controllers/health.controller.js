/**
 * Health check: tells the app, Postman and the host whether the API and its database are up.
 * `checkDatabase` is injected so tests do not need MySQL.
 */
function createHealthController({ checkDatabase }) {
  return {
    async getHealth(_req, res) {
      const databaseUp = await checkDatabase();
      const body = {
        status: databaseUp ? 'ok' : 'degraded',
        service: 'medicheck-api',
        database: databaseUp ? 'up' : 'down',
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      };
      res.status(databaseUp ? 200 : 503).json(body);
    },
  };
}

module.exports = { createHealthController };
