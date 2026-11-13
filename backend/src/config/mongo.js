
const { MongoClient } = require('mongodb');
const config = require('./env');
const dns = require('dns');

// Public DNS servers for MongoDB SRV lookups.
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

/** Ping MongoDB to verify that the database is reachable. */
async function checkMongo() {
  try {
    if (!db) return false;

    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

/** Close the MongoDB connection. */
async function closeMongo() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

module.exports = { connectMongo, checkMongo, closeMongo };
