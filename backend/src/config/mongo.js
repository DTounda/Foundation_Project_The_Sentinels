const { MongoClient } = require('mongodb');
const config = require('./env');

const dns = require('dns');

// Some internet providers cannot answer the SRV lookup that mongodb+srv:// needs.
// Use public DNS servers for that lookup.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let client;
let db;

/** Connect once and reuse the same client for the whole app. */
async function connectMongo() {
  if (!db) {
    client = new MongoClient(config.mongo.uri);
    await client.connect();
    db = client.db(config.mongo.dbName);
  }
  return db;
}

/** Returns true when Mongo answers a ping. Used by the health check. */
async function checkMongo() {
  try {
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

async function closeMongo() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

module.exports = { connectMongo, checkMongo, closeMongo };
