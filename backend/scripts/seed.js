
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { MongoClient } = require('mongodb');

const FDA_FILE = process.env.FDA_FILE
  ? path.resolve(process.env.FDA_FILE)
  : null;

const REVIEW_FILE = path.join(__dirname, 'fda_seed_review.json');
const UNKNOWN_INGREDIENTS_FILE = path.join(
  __dirname,
  'fda_unknown_ingredients.json',
);

const SALT_WORDS = [
  'fumarate', 'besilate', 'besylate', 'mesilate', 'mesylate',
  'maleate', 'tartrate', 'succinate', 'phosphate', 'acetate',
  'bromide', 'monohydrate', 'dihydrate', 'trihydrate', 'hyclate',
  'hydrochloride', 'sodium', 'potassium', 'sulfate', 'citrate',
];

const MINERAL_WORDS = [
  'ferrous', 'potassium', 'sodium', 'calcium',
  'magnesium', 'zinc', 'iron',
];

const DOSAGE_WORDS = [
  'tablet', 'tablets', 'capsule', 'capsules', 'injection',
  'inhalation', 'pressurised', 'pressurized', 'suspension',
  'syrup', 'dispersible', 'solution', 'emulsion', 'oral',
  'cream', 'ointment', 'drops', 'drop', 'gel', 'powder',
  'concentrate', 'infusion', 'suppository', 'suppositories',
  'spray', 'patch', 'patches',
];

const UNCERTAIN_WORDS = [
  'equivalent', 'eq', 'w/w', 'w/v', 'to',
];

const DOSAGE_FORM_ENDING =
  /\b(?:pressurised|pressurized)?\s*(?:tablets?|capsules?|injections?|inhalations?|suspensions?|syrups?|solutions?|emulsions?|creams?|ointments?|drops?|gels?|powders?|infusions?|suppositories|sprays?|patches?)\s*$/i;

const STANDARD_WORDS = /\b(?:usp|bp|ph\.?\s*eur|usp-nf)\b/gi;

const MICROGRAM = String.raw`(?:mcg|\u03bcg|\u00b5g|ug)`;
const STRENGTH_UNIT = String.raw`(?:${MICROGRAM}|mg|kg|g|ml|l|iu|units?)`;

const STRENGTH_PATTERN = new RegExp(
  String.raw`\b\d+(?:[.,]\d+)?\s*${STRENGTH_UNIT}\b`,
  'gi',
);

function isMissing(value) {
  if (value === null || value === undefined) return true;

  const text = String(value).trim().toLowerCase();

  return ['', '-', 'â€”', 'â€“', 'n/a', 'na'].includes(text);
}

function normalizeText(value) {
  if (isMissing(value)) return '';

  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function nextId(db, name) {
  const counter = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );

  const document = counter?.value ?? counter;

  if (!document || !Number.isSafeInteger(document.seq)) {
    throw new Error(`Could not generate the next ID for ${name}`);
  }

  return document.seq;
}

function extractStrengths(value) {
  const text = normalizeText(value);
  const matches = text.match(STRENGTH_PATTERN);

  return matches ? matches.map(item => item.trim()) : [];
}

function removeStrength(value) {
  return normalizeText(value)
    .replace(
      new RegExp(
        String.raw`\b\d+(?:[.,]\d+)?\s*\/\s*\d+(?:[.,]\d+)?\s*${STRENGTH_UNIT}?\b`,
        'gi',
      ),
      ' ',
    )
    .replace(STRENGTH_PATTERN, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*%\s*(?:w\/w|w\/v)?\b/gi, ' ')
    .replace(/\b(?:w\/w|w\/v)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitParts(value) {
  if (isMissing(value)) return [];

  const source = normalizeText(value);
  const parts = [];

  let start = 0;
  let parentheses = 0;
  let brackets = 0;

  for (let i = 0; i < source.length; i += 1) {
    const character = source[i];

    if (character === '(') parentheses += 1;
    if (character === ')') parentheses = Math.max(0, parentheses - 1);
    if (character === '[') brackets += 1;
    if (character === ']') brackets = Math.max(0, brackets - 1);

    if (parentheses > 0 || brackets > 0) continue;

    let separatorLength = 0;

    if (['+', '&', ','].includes(character)) {
      separatorLength = 1;
    } else if (character === '/') {
      const left = source.slice(start, i).trim();
      const right = source.slice(i + 1).trim();

      const unitRatio = new RegExp(
        String.raw`(?:${STRENGTH_UNIT}|w|v)$`,
        'i',
      ).test(left) && new RegExp(
        String.raw`^(?:\d|${STRENGTH_UNIT}|w|v)\b`,
        'i',
      ).test(right);

      if (!unitRatio) separatorLength = 1;
    } else {
      const match = source.slice(i).match(/^and\b/i);
      if (match) separatorLength = match[0].length;
    }

    if (!separatorLength) continue;

    const left = source.slice(start, i).trim();
    const right = source.slice(i + separatorLength).trim();

    if (!left || !right) continue;

    if (character === ',' && /^\d/.test(right)) continue;

    parts.push(left);
    start = i + separatorLength;
    i += separatorLength - 1;
  }

  const remaining = source.slice(start).trim();
  if (remaining) parts.push(remaining);

  return parts
    .map(part =>
      part.replace(/^[\s.,;:/]+|[\s.,;:/]+$/g, '').trim(),
    )
    .filter(Boolean);
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, character => character.toUpperCase());
}

function containsWord(value, words) {
  const normalized = value.toLowerCase();

  return words.some(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(normalized);
  });
}

function removeRepeatedSaltPhrase(value) {
  const text = normalizeText(value);
  const asIndex = text.toLowerCase().indexOf(' as ');

  if (asIndex === -1) {
    return { value: text, uncertain: false };
  }

  const base = text.slice(0, asIndex).trim();
  const suffix = text.slice(asIndex + 4).trim();

  if (!base || !suffix) {
    return { value: text, uncertain: true };
  }

  const normalizedBase = base.toLowerCase();
  const normalizedSuffix = suffix.toLowerCase();

  if (normalizedSuffix.startsWith(`${normalizedBase} `)) {
    const remaining = normalizedSuffix.slice(normalizedBase.length).trim();

    const remainingWords = remaining
      .replace(/[.,;]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (
      remainingWords.length > 0 &&
      remainingWords.every(word => SALT_WORDS.includes(word))
    ) {
      return { value: base, uncertain: false };
    }
  }

  return { value: text, uncertain: true };
}

function cleanIngredientName(originalName) {
  const original = normalizeText(originalName);
  const withoutStrength = removeStrength(original);

  let candidate = withoutStrength.replace(STANDARD_WORDS, ' ').trim();

  candidate = candidate
    .replace(/\bpressurised\b/gi, ' ')
    .replace(/\bpressurized\b/gi, ' ')
    .replace(/\banhydrous\b/gi, ' ')
    .replace(/\bfor\s+(?:oral\s+)?injection\b/gi, ' ')
    .replace(/\bfor\s+inhalation\b/gi, ' ')
    .replace(DOSAGE_FORM_ENDING, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let uncertainParentheses = false;
  const removedSalts = [];

  candidate = candidate.replace(/\(\s*as\s+([^)]*)\)/gi, (full, phrase) => {
    const words = phrase
      .toLowerCase()
      .replace(/[.,;]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length && words.every(word => SALT_WORDS.includes(word))) {
      removedSalts.push(...words);
      return ' ';
    }

    uncertainParentheses = true;
    return full;
  });

  const repeatedPhrase = removeRepeatedSaltPhrase(candidate);
  candidate = repeatedPhrase.value;

  const hasUnrecognizedParentheses = /[()[\]]/.test(candidate);

  const words = candidate
    .replace(/[()[\]]/g, ' ')
    .replace(/[.,;:]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const keptWords = [];

  for (const word of words) {
    const normalizedWord = word.toLowerCase().replace(/[^a-z]/g, '');

    if (SALT_WORDS.includes(normalizedWord)) {
      removedSalts.push(normalizedWord);
      continue;
    }

    keptWords.push(word);
  }

  const cleaned = keptWords.join(' ').replace(/\s+/g, ' ').trim();
  const mineralOnly = MINERAL_WORDS.includes(cleaned.toLowerCase());

  if (!cleaned || mineralOnly) {
    return {
      name: titleCase(original),
      nameKey: original.toLowerCase(),
      removedSalts: [],
      preservationRequired: true,
      uncertain: true,
    };
  }

  const pharmaceuticalWording =
    containsWord(cleaned, DOSAGE_WORDS) ||
    containsWord(cleaned, UNCERTAIN_WORDS);

  if (
    pharmaceuticalWording ||
    repeatedPhrase.uncertain ||
    uncertainParentheses ||
    hasUnrecognizedParentheses
  ) {
    return {
      name: titleCase(original),
      nameKey: original.toLowerCase(),
      removedSalts: [],
      preservationRequired: true,
      uncertain: true,
    };
  }

  return {
    name: titleCase(cleaned),
    nameKey: cleaned.toLowerCase(),
    removedSalts,
    preservationRequired: false,
    uncertain: false,
  };
}

function addReview(review, medicine, details) {
  review.push({
    fdaSerialNumber: medicine.fdaSerialNumber,
    brandName: medicine.brandName,
    fdaGenericName: medicine.fdaGenericName,
    ...details,
  });
}

function parseIngredients(medicine, review) {
  const genericName = medicine.fdaGenericName;

  if (isMissing(genericName)) {
    addReview(review, medicine, {
      reason: 'Missing FDA Generic Name. No ingredients extracted.',
    });
    return [];
  }

  const genericText = normalizeText(genericName)
    .replace(DOSAGE_FORM_ENDING, '')
    .trim();

  // Extract strengths before removing them from ingredient names.
  const genericStrengths = extractStrengths(genericText);
  const externalStrengths = extractStrengths(medicine.strength);

  // Remove strengths first so strength ratios do not become ingredients.
  let ingredientText = genericText.replace(STRENGTH_PATTERN, ' ');

  // After removing strengths, remove leftover ratio separators.
  if (genericStrengths.length > 1) {
    ingredientText = ingredientText.replace(/[/]+/g, ' ');
  }

  ingredientText = ingredientText
    .replace(/\s+/g, ' ')
    .trim();

  const originalParts = splitParts(ingredientText);

  if (originalParts.length === 0) {
    addReview(review, medicine, {
      reason: 'No ingredients could be extracted.',
    });
    return [];
  }

  let strengthParts = [];

  if (genericStrengths.length === originalParts.length) {
    strengthParts = genericStrengths;
  } else if (externalStrengths.length === originalParts.length) {
    strengthParts = externalStrengths;
  } else if (externalStrengths.length === 1 && originalParts.length === 1) {
    strengthParts = externalStrengths;
  }

  if (
    !isMissing(medicine.strength) &&
    externalStrengths.length > 0 &&
    externalStrengths.length !== originalParts.length &&
    genericStrengths.length !== originalParts.length
  ) {
    addReview(review, medicine, {
      strength: medicine.strength,
      reason: 'Strength count does not match ingredient count.',
      parsedIngredients: originalParts,
    });
  }

  if (
    genericStrengths.length > 0 &&
    genericStrengths.length !== originalParts.length
  ) {
    addReview(review, medicine, {
      genericName,
      extractedStrengths: genericStrengths,
      reason: 'Generic-name strength count does not match ingredient count.',
    });
  }

  const candidates = [];
  let unsafe = false;

  for (let index = 0; index < originalParts.length; index += 1) {
    const originalPart = originalParts[index];
    const cleaned = cleanIngredientName(originalPart);

    if (!cleaned.name || !cleaned.nameKey) {
      unsafe = true;

      addReview(review, medicine, {
        originalIngredient: originalPart,
        reason: 'Could not safely clean ingredient.',
      });
      continue;
    }

    if (cleaned.removedSalts.length > 0) {
      addReview(review, medicine, {
        originalIngredient: originalPart,
        cleanedIngredient: cleaned.name,
        removedSalts: cleaned.removedSalts,
        reason: 'Salt form removed. Manual review required.',
      });
    }

    if (cleaned.uncertain || cleaned.preservationRequired) {
      unsafe = true;

      addReview(review, medicine, {
        originalIngredient: originalPart,
        reason: 'Uncertain ingredient wording. Original retained; no ingredients imported.',
      });
      continue;
    }

    candidates.push({
      name: cleaned.name,
      nameKey: cleaned.nameKey,
      strength: strengthParts[index] || '',
    });
  }

  if (unsafe || candidates.length !== originalParts.length) {
    addReview(review, medicine, {
      originalGenericName: genericName,
      reason: 'One or more ingredients could not be safely identified. Entire ingredient list left empty.',
    });
    return [];
  }

  return candidates;
}

// ---------- FDA REGISTRATION DATE VALIDATION ----------

function createValidatedDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseFdaDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return createValidatedDate(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    );
  }

  // Excel stores many dates as serial numbers.
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = xlsx.SSF.parse_date_code(value);

    if (!parsed || !parsed.y || !parsed.m || !parsed.d) {
      return null;
    }

    return createValidatedDate(parsed.y, parsed.m, parsed.d);
  }

  const text = String(value).trim();

  if (!text) return null;

  // ISO: YYYY-MM-DD
  let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

  if (match) {
    const [, year, month, day] = match;
    return createValidatedDate(
      Number(year),
      Number(month),
      Number(day),
    );
  }

  // Day-first: DD/MM/YYYY or DD-MM-YYYY
  match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const [, day, month, year] = match;
    return createValidatedDate(
      Number(year),
      Number(month),
      Number(day),
    );
  }

  // Text dates: 15-Jan-2026 or 15 January 2026
  const monthNames = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  match = text.match(/^(\d{1,2})[\s-]+([a-z]+)[\s,-]+(\d{4})$/i);

  if (match) {
    const [, day, monthText, year] = match;
    const month = monthNames[monthText.toLowerCase()];

    if (month !== undefined) {
      return createValidatedDate(
        Number(year),
        month + 1,
        Number(day),
      );
    }
  }

  return null;
}

function determineVerifiedStatus(medicine, review) {
  const registrationDate = parseFdaDate(medicine.registrationDate);
  const expiryDate = parseFdaDate(medicine.expiryDate);

  if (!registrationDate || !expiryDate) {
    addReview(review, medicine, {
      registrationDate: medicine.registrationDate,
      expiryDate: medicine.expiryDate,
      reason: 'Registration or expiry date is missing or invalid. Medicine marked unverified.',
    });

    return 'unverified';
  }

  const today = new Date();

  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (expiryDate.getTime() < todayUtc) {
    addReview(review, medicine, {
      expiryDate: medicine.expiryDate,
      reason: 'Registration has expired. Medicine marked unverified.',
    });

    return 'unverified';
  }

  if (registrationDate.getTime() > todayUtc) {
    addReview(review, medicine, {
      registrationDate: medicine.registrationDate,
      reason: 'Registration date is in the future. Medicine marked unverified.',
    });

    return 'unverified';
  }

  return 'verified';
}

// ---------- FDA FILE ----------

function readFdaFile() {
  if (!FDA_FILE) {
    throw new Error(
      'FDA_FILE is missing. Add FDA_FILE=path-to-your-FDA-file.xlsx to your .env file.',
    );
  }

  if (!fs.existsSync(FDA_FILE)) {
    throw new Error(`FDA file not found: ${FDA_FILE}`);
  }

  const workbook = xlsx.readFile(FDA_FILE, {
    cellDates: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    throw new Error('The FDA Excel file does not contain a readable worksheet.');
  }

  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
}

function normalizeMedicine(row) {
  return {
    fdaSerialNumber: normalizeText(row['SN']),
    registrationNumber: normalizeText(row['Registration No.']),
    brandName: normalizeText(row['Brand Name']),
    fdaGenericName: normalizeText(row['Generic Name']),
    manufacturer: normalizeText(row['Manufacturer']),
    country: normalizeText(row['Country']),
    strength: normalizeText(row['Strength']),
    registrationDate: row['Reg. Date'],
    expiryDate: row['Expiry Date'],
  };
}

function buildDryRun(rows) {
  const review = [];
  const medicines = [];
  const ingredientNames = new Map();

  for (const row of rows) {
    const medicine = normalizeMedicine(row);

    if (
      isMissing(medicine.fdaSerialNumber) ||
      isMissing(medicine.registrationNumber) ||
      isMissing(medicine.brandName)
    ) {
      addReview(review, medicine, {
        reason: 'Required medicine identity field missing. Medicine excluded from import.',
      });
      continue;
    }

    const ingredients = parseIngredients(medicine, review);
    const verifiedStatus = determineVerifiedStatus(medicine, review);

    if (isMissing(medicine.manufacturer)) {
      addReview(review, medicine, {
        reason: 'Manufacturer missing. Medicine excluded from import.',
      });
      continue;
    }

    for (const ingredient of ingredients) {
      ingredientNames.set(ingredient.nameKey, ingredient.name);
    }

    medicines.push({
      medicineId: Number(medicine.fdaSerialNumber),
      fdaSerialNumber: medicine.fdaSerialNumber,
      registrationNumber: medicine.registrationNumber,
      brandName: medicine.brandName,
      genericName: medicine.fdaGenericName,
      strength: medicine.strength,
      manufacturer: medicine.manufacturer,
      country: medicine.country,
      verifiedStatus,
      ingredientsKnown: ingredients.length > 0,
      barcode: null,
      ingredients: ingredients.map(ingredient => ({
        ingredientId: null,
        name: ingredient.name,
        strength: ingredient.strength,
        nameKey: ingredient.nameKey,
      })),
    });
  }

  return { medicines, ingredientNames, review };
}

function validateSerialNumbers(rows) {
  const seen = new Set();

  for (const row of rows) {
    const medicine = normalizeMedicine(row);
    const serial = medicine.fdaSerialNumber;

    if (isMissing(serial) || !/^\d+$/.test(serial)) {
      throw new Error(`Invalid FDA serial number: ${serial}`);
    }

    const numericSerial = Number(serial);

    if (!Number.isSafeInteger(numericSerial)) {
      throw new Error(`FDA serial number is outside the safe integer range: ${serial}`);
    }

    if (seen.has(numericSerial)) {
      throw new Error(`Duplicate FDA serial number: ${serial}`);
    }

    seen.add(numericSerial);
  }
}

function writeReviewFile(review) {
  fs.writeFileSync(REVIEW_FILE, JSON.stringify(review, null, 2), 'utf8');
}

function writeUnknownIngredientsFile(medicines) {
  const unknownMedicines = medicines
    .filter(medicine => medicine.ingredients.length === 0)
    .map(medicine => ({
      fdaSerialNumber: medicine.fdaSerialNumber,
      brandName: medicine.brandName,
      genericName: medicine.genericName,
      registrationNumber: medicine.registrationNumber,
      manufacturer: medicine.manufacturer,
      strength: medicine.strength,
      ingredientsKnown: false,
      extractedIngredients: [],
    }));

  fs.writeFileSync(
    UNKNOWN_INGREDIENTS_FILE,
    JSON.stringify(unknownMedicines, null, 2),
    'utf8',
  );

  return unknownMedicines.length;
}

function printSelectedMedicineCheck(medicines) {
  console.log('\n===== SELECTED MEDICINE CHECK =====');

  for (const id of ['3', '10', '24', '25', '28']) {
    const medicine = medicines.find(
      item => item.fdaSerialNumber === id,
    );

    if (!medicine) {
      console.log(`FDA ${id}: Medicine not found in import list.`);
      continue;
    }

    console.log(`\nFDA ${id}: ${medicine.brandName}`);
    console.log('Generic name:', medicine.genericName);
    console.log(
      'Ingredients:',
      medicine.ingredients.map(ingredient => ({
        name: ingredient.name,
        strength: ingredient.strength,
      })),
    );
    console.log('Ingredients known:', medicine.ingredientsKnown);
    console.log('Verified status:', medicine.verifiedStatus);
  }
}

async function findOrCreateIngredient(db, name, nameKey) {
  const collection = db.collection('Ingredients');

  let ingredient = await collection.findOne({ nameKey });

  if (ingredient) return ingredient;

  const ingredientId = await nextId(db, 'ingredients');

  try {
    await collection.insertOne({
      ingredientId,
      name,
      nameKey,
      description: '',
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  ingredient = await collection.findOne({ nameKey });

  if (!ingredient) {
    throw new Error(`Could not create or find ingredient: ${name}`);
  }

  return ingredient;
}

async function run() {
  const rows = readFdaFile();

  console.log(`FDA records ready: ${rows.length}`);

  validateSerialNumbers(rows);

  const result = buildDryRun(rows);

  printSelectedMedicineCheck(result.medicines);

  writeReviewFile(result.review);

  const unknownIngredientCount =
    writeUnknownIngredientsFile(result.medicines);

  const emptyIngredientLists = result.medicines.filter(
    medicine => medicine.ingredients.length === 0,
  ).length;

  const verifiedCount = result.medicines.filter(
    medicine => medicine.verifiedStatus === 'verified',
  ).length;

  const unverifiedCount = result.medicines.filter(
    medicine => medicine.verifiedStatus === 'unverified',
  ).length;

  console.log('\n===== FDA DRY RUN SUMMARY =====');
  console.log(`FDA records inspected: ${rows.length}`);
  console.log(`Medicines ready for import: ${result.medicines.length}`);
  console.log(
    `Medicines with extracted ingredients: ${result.medicines.length - emptyIngredientLists}`,
  );
  console.log(`Medicines with empty ingredient lists: ${emptyIngredientLists}`);
  console.log(`Medicines with unknown ingredients: ${unknownIngredientCount}`);
  console.log(`Verified registrations: ${verifiedCount}`);
  console.log(`Unverified registrations: ${unverifiedCount}`);
  console.log(`Unique ingredient records prepared: ${result.ingredientNames.size}`);
  console.log(`Review entries: ${result.review.length}`);
  console.log(`Review file: ${REVIEW_FILE}`);
  console.log(`Unknown ingredient file: ${UNKNOWN_INGREDIENTS_FILE}`);

  if (process.argv.includes('--dry-run')) {
    console.log('\nDry run only. No MongoDB connection was opened.');
    console.log('No database records were created or changed.');
    return;
  }

  if (process.env.DB_DRIVER !== 'mongo') {
    throw new Error('DB_DRIVER must be set to mongo before importing.');
  }

  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error('MONGODB_URI and MONGODB_DB must be configured.');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    const db = client.db(process.env.MONGODB_DB);
    const medicinesCollection = db.collection('Medicines');

    console.log('\nConnected to MongoDB.');
    console.log('Starting FDA medicine import...');

    let imported = 0;

    for (const medicine of result.medicines) {
      const embeddedIngredients = [];

      for (const ingredient of medicine.ingredients) {
        const savedIngredient = await findOrCreateIngredient(
          db,
          ingredient.name,
          ingredient.nameKey,
        );

        embeddedIngredients.push({
          ingredientId: savedIngredient.ingredientId,
          name: savedIngredient.name,
          strength: ingredient.strength,
        });
      }

      const document = {
        medicineId: medicine.medicineId,
        fdaSerialNumber: medicine.fdaSerialNumber,
        registrationNumber: medicine.registrationNumber,
        brandName: medicine.brandName,
        genericName: medicine.genericName,
        strength: medicine.strength,
        manufacturer: medicine.manufacturer,
        country: medicine.country,
        verifiedStatus: medicine.verifiedStatus,
        ingredientsKnown: medicine.ingredientsKnown,
        barcode: medicine.barcode,
        ingredients: embeddedIngredients,
      };

      await medicinesCollection.updateOne(
        { fdaSerialNumber: medicine.fdaSerialNumber },
        { $set: document },
        { upsert: true },
      );

      imported += 1;

      if (imported % 100 === 0) {
        console.log(`Imported ${imported}/${result.medicines.length}`);
      }
    }

    console.log(`\nFDA import completed. Medicines processed: ${imported}`);
    console.log(`Unique ingredients prepared: ${result.ingredientNames.size}`);
  } finally {
    await client.close();
  }
}

run().catch(error => {
  console.error('\nFDA seed failed:', error.message);
  process.exitCode = 1;
});

