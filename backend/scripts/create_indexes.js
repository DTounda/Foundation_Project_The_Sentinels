
require('dotenv').config();

const { MongoClient } = require('mongodb');

const COLLECTIONS = [
  'Medicines',
  'Ingredients',
  'Users',
  'UserAllergies',
  'VerificationLogs',
  'SuspiciousReports',
  'counters',
];

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'medicheck';

  if (!uri) {
    throw new Error('MONGODB_URI is missing from environment variables');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Create collections if they do not already exist.
    for (const name of COLLECTIONS) {
      const exists = await db.listCollections({ name }).hasNext();

      if (!exists) {
        await db.createCollection(name);
        console.log(`Created collection: ${name}`);
      }
    }

    // Medicines
    const medicines = db.collection('Medicines');

    await medicines.createIndex(
      { medicineId: 1 },
      { unique: true, name: 'unique_medicine_id' },
    );

    await medicines.createIndex(
      { fdaSerialNumber: 1 },
      {
        unique: true,
        sparse: true,
        name: 'unique_fda_serial_number',
      },
    );

    await medicines.createIndex(
      { registrationNumber: 1 },
      { name: 'registration_number_index' },
    );

    await medicines.createIndex(
      { barcode: 1 },
      {
        unique: true,
        partialFilterExpression: { barcode: { $type: 'string' } },
        name: 'unique_medicine_barcode',
      },
    );

    await medicines.createIndex(
      { brandName: 1 },
      { name: 'medicine_brand_name_index' },
    );

    await medicines.createIndex(
      { genericName: 1 },
      { name: 'medicine_generic_name_index' },
    );

    // Ingredients
    const ingredients = db.collection('Ingredients');

    await ingredients.createIndex(
      { ingredientId: 1 },
      { unique: true, name: 'unique_ingredient_id' },
    );

    await ingredients.createIndex(
      { nameKey: 1 },
      { unique: true, name: 'unique_ingredient_name_key' },
    );

    // Users
    await db.collection('Users').createIndex(
      { email: 1 },
      { unique: true, name: 'unique_user_email' },
    );

    // UserAllergies
    const userAllergies = db.collection('UserAllergies');

    await userAllergies.createIndex(
      { allergyId: 1 },
      { unique: true, name: 'unique_allergy_id' },
    );

    await userAllergies.createIndex(
      { userId: 1 },
      { name: 'user_allergies_user_index' },
    );

    await userAllergies.createIndex(
      { userId: 1, ingredientId: 1 },
      { unique: true, name: 'unique_user_allergy_pair' },
    );

    // VerificationLogs
    const verificationLogs = db.collection('VerificationLogs');

    await verificationLogs.createIndex(
      { userId: 1 },
      { name: 'verification_user_index' },
    );

    await verificationLogs.createIndex(
      { medicineId: 1 },
      { name: 'verification_medicine_index' },
    );

    await verificationLogs.createIndex(
      { createdAt: 1 },
      { name: 'verification_created_at_index' },
    );

    // SuspiciousReports
    const reports = db.collection('SuspiciousReports');

    await reports.createIndex(
      { userId: 1 },
      { name: 'report_user_index' },
    );

    await reports.createIndex(
      { medicineId: 1 },
      { name: 'report_medicine_index' },
    );

    await reports.createIndex(
      { status: 1 },
      { name: 'report_status_index' },
    );

    await reports.createIndex(
      { createdAt: 1 },
      { name: 'report_created_at_index' },
    );

    console.log('MongoDB collections and indexes created successfully.');
  } finally {
    await client.close();
  }
}

createIndexes().catch(error => {
  console.error('Index creation failed:', error.message);
  process.exitCode = 1;
});
