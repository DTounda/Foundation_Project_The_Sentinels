const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');
const path = require('path');

require('dotenv').config();

const FILE_PATH = path.join(
  process.env.USERPROFILE || '',
  'Desktop',
  'Rwanda_FDA_Medicines.xlsx',
);

async function seedMedicines() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'medicheck';

  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }

  // Check that the FDA Excel file exists and can be read.
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error('No worksheet found in the FDA Excel file');
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 2,
    defval: null,
  });

  // Prepare FDA medicine records.
  const medicines = rows
    .filter(row => row['Registration No.'])
    .map(row => ({
      fdaSerialNumber: Number(row.SN),
      registrationNumber: String(row['Registration No.']).trim(),
      brandName: row['Brand Name'],
      genericName: row['Generic Name'],
      name: row['Brand Name'] || row['Generic Name'],
      strength: row['Strength'],
      dosageForm: row['Dosage Form'],
      packSize: row['Pack Size'],
      shelfLife: row['Shelf Life'],
      manufacturer: row['Manufacturer'],
      country: row['Country'],
      marketingAuthorizationHolder: row['MAH / Local Agent'],
      ltr: row.LTR,
      registrationDate: row['Reg.Date'],
      expiryDate: row['Expiry Date'],
      source: 'Rwanda FDA',
    }));

  // Validate FDA serial numbers.
  const invalidRecords = medicines.filter(
    medicine =>
      !Number.isInteger(medicine.fdaSerialNumber) ||
      medicine.fdaSerialNumber <= 0,
  );

  if (invalidRecords.length > 0) {
    throw new Error(
      `${invalidRecords.length} FDA records have invalid serial numbers`,
    );
  }

  const serialNumbers = new Set(
    medicines.map(medicine => medicine.fdaSerialNumber),
  );

  if (serialNumbers.size !== medicines.length) {
    throw new Error('Duplicate FDA serial numbers found. Import stopped.');
  }

  console.log(`FDA records ready: ${medicines.length}`);
  console.log(`Unique FDA serial numbers: ${serialNumbers.size}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('Medicines');
    const counters = db.collection('counters');

    let inserted = 0;
    let updated = 0;

    // Import records individually to preserve existing numeric IDs.
    for (const medicine of medicines) {
      const existing = await collection.findOne({
        source: 'Rwanda FDA',
        fdaSerialNumber: medicine.fdaSerialNumber,
      });

      if (existing) {
        await collection.updateOne(
          { _id: existing._id },
          { $set: medicine },
        );
        updated++;
      } else {
        const counter = await counters.findOneAndUpdate(
          { _id: 'medicines' },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: 'after' },
        );

        await collection.insertOne({
          ...medicine,
          id: counter.seq,
        });

        inserted++;
      }
    }

    console.log(`New records inserted: ${inserted}`);
    console.log(`Existing records updated: ${updated}`);
    console.log('FDA medicine import completed successfully.');
  } finally {
    await client.close();
  }
}

seedMedicines().catch(error => {
  console.error('FDA seed failed:', error.message);
  process.exitCode = 1;
});