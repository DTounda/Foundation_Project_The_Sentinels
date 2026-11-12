const config = require('./config/env');
const mysql = require('./config/db');
const mongo = require('./config/mongo');
const { createMysqlRepositories, createMongoRepositories } = require('./repositories');
const { createApp } = require('./app');

/** DB_DRIVER in .env picks the database: 'mysql' (default) or 'mongo'. */
async function start() {
  let repositories;
  let checkDatabase;
  let closeDatabase;

  if (config.dbDriver === 'mongo') {
    const db = await mongo.connectMongo();
    repositories = createMongoRepositories(db);
    checkDatabase = mongo.checkMongo;
    closeDatabase = mongo.closeMongo;
  } else {
    repositories = createMysqlRepositories(mysql.getPool());
    checkDatabase = mysql.checkDatabase;
    closeDatabase = mysql.closePool;
  }

  const app = createApp({ config, checkDatabase, repositories });
  const server = app.listen(config.port, () => {
    console.info(
      `MediCheck API (${config.dbDriver}) listening on http://localhost:${config.port}/api/v1/health`,
    );
  });

  function shutdown() {
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Could not start the API:', err.message);
  process.exit(1);
});
