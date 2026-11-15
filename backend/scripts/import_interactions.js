// Imports drug-drug interaction pairs from DDInter (https://ddinter2.scbdd.com),
// an open-access research database, published under CC BY-NC-SA 4.0. We only
// keep Major and Moderate pairs, and only where both drugs match an ingredient
// we already carry.
//
// Usage:
//   node scripts/import_interactions.js --dry-run
//   node scripts/import_interactions.js
//
// DDINTER_DIR (in .env) should point to a folder holding the 8 CSVs downloaded
// from DDInter's download page. They are not committed to the repo.

require('dotenv').config();

// Some networks block the DNS lookup `mongodb+srv://` needs; this matches the
// fix already in src/config/mongo.js.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { resolveIngredientId } = require('../src/services/interactionMatcher');

const DDINTER_DIR = path.resolve(process.env.DDINTER_DIR || './data/ddinter');
const KEPT_LEVELS = new Set(['Major', 'Moderate']);
const LEVEL_RANK = { Major: 2, Moderate: 1 };
const UNMATCHED_FILE = path.join(__dirname, 'ddinter_unmatched_drugs.json');

/** A minimal CSV line splitter: good enough for DDInter's simple, unquoted rows. */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row = {};
    header.forEach((key, index) => {
      row[key.trim()] = (cells[index] || '').trim();
    });
    return row;
  });
}

function readDdinterFiles() {
  if (!fs.existsSync(DDINTER_DIR)) {
    throw new Error(`DDInter folder not found: ${DDINTER_DIR}. Set DDINTER_DIR in .env.`);
  }

  const files = fs.readdirSync(DDINTER_DIR).filter((name) => name.endsWith('.csv'));
  if (files.length === 0) {
    throw new Error(`No .csv files found in ${DDINTER_DIR}`);
  }

  const rows = [];
  for (const file of files) {
    rows.push(...parseCsv(fs.readFileSync(path.join(DDINTER_DIR, file), 'utf8')));
  }
  return rows;
}

/** nameKey -> { ingredientId, name }, read from our own Ingredients collection. */
async function loadIngredientIndex(db) {
  const documents = await db
    .collection('Ingredients')
    .find({}, { projection: { ingredientId: 1, nameKey: 1, name: 1 } })
    .toArray();

  const index = new Map();
  for (const document of documents) {
    index.set(document.nameKey, { ingredientId: document.ingredientId, name: document.name });
  }
  return index;
}

/** Resolves and filters DDInter rows down to pairs between ingredients we carry. */
function buildPairs(rows, nameKeyToIngredient) {
  const unmatchedDrugNames = new Set();
  const pairs = new Map(); // "idA:idB" (sorted) -> { ingredientIdA, ingredientIdB, level }

  for (const row of rows) {
    const level = row.Level;
    if (!KEPT_LEVELS.has(level)) continue;

    const idA = resolveIngredientId(row.Drug_A, nameKeyToIngredient);
    const idB = resolveIngredientId(row.Drug_B, nameKeyToIngredient);

    if (idA === null) unmatchedDrugNames.add(row.Drug_A);
    if (idB === null) unmatchedDrugNames.add(row.Drug_B);
    if (idA === null || idB === null || idA === idB) continue;

    const [ingredientIdA, ingredientIdB] = idA < idB ? [idA, idB] : [idB, idA];
    const key = `${ingredientIdA}:${ingredientIdB}`;
    const existing = pairs.get(key);

    if (!existing || LEVEL_RANK[level] > LEVEL_RANK[existing.level]) {
      pairs.set(key, { ingredientIdA, ingredientIdB, level });
    }
  }

  return { pairs: [...pairs.values()], unmatchedDrugNames: [...unmatchedDrugNames].sort() };
}

async function run() {
  const rows = readDdinterFiles();
  console.log(`DDInter rows read: ${rows.length}`);

  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error('MONGODB_URI and MONGODB_DB must be configured.');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    const nameKeyToIngredient = await loadIngredientIndex(db);
    console.log(`Our ingredients loaded: ${nameKeyToIngredient.size}`);

    const { pairs, unmatchedDrugNames } = buildPairs(rows, nameKeyToIngredient);

    fs.writeFileSync(UNMATCHED_FILE, JSON.stringify(unmatchedDrugNames, null, 2));

    console.log('\n===== DDINTER IMPORT SUMMARY =====');
    console.log(`Usable interaction pairs (Major/Moderate, both sides matched): ${pairs.length}`);
    console.log(`DDInter drug names we could not match: ${unmatchedDrugNames.length}`);
    console.log(`Unmatched names written to: ${UNMATCHED_FILE}`);
    console.log(
      `Major: ${pairs.filter((p) => p.level === 'Major').length}, ` +
        `Moderate: ${pairs.filter((p) => p.level === 'Moderate').length}`,
    );

    if (process.argv.includes('--dry-run')) {
      console.log('\nDry run only. No interactions were written.');
      return;
    }

    const interactions = db.collection('Interactions');
    const operations = pairs.map((pair) => ({
      updateOne: {
        filter: { ingredientIdA: pair.ingredientIdA, ingredientIdB: pair.ingredientIdB },
        update: { $set: { level: pair.level } },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      const result = await interactions.bulkWrite(operations, { ordered: false });
      console.log(`\nWritten: ${result.upsertedCount} new, ${result.modifiedCount} updated.`);
    }
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Interaction import failed:', error.message);
  process.exitCode = 1;
});
