const config = require('./config/env');
const { checkDatabase, closePool, getPool } = require('./config/db');
const { createMysqlRepositories } = require('./repositories');
const { createApp } = require('./app');

const app = createApp({
  config,
  checkDatabase,
  repositories: createMysqlRepositories(getPool()),
});

const server = app.listen(config.port, () => {
  console.info(`MediCheck API listening on http://localhost:${config.port}/api/v1/health`);
});

async function shutdown() {
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
