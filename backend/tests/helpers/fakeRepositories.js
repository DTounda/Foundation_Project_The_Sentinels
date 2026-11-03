/**
 * In-memory repositories with the same methods as the MySQL ones.
 * They let us test the whole API (routes -> controllers -> services) without a database.
 */

const SAMPLE_MEDICINES = [
  {
    id: 1,
    name: 'Paracetamol 500 mg tablets',
    manufacturer: 'Example Pharma Ltd',
    registrationNumber: 'RW-0001',
    barcode: '6001234567890',
    verifiedStatus: 'verified',
  },
  {
    id: 2,
    name: 'Amoxicillin 250 mg capsules',
    manufacturer: 'Example Pharma Ltd',
    registrationNumber: 'RW-0002',
    barcode: '6001234567891',
    verifiedStatus: 'verified',
  },
  {
    id: 3,
    name: 'Ibuprofen 400 mg tablets',
    manufacturer: 'Unknown Importer',
    registrationNumber: 'RW-0003',
    barcode: '6001234567892',
    verifiedStatus: 'unverified',
  },
  {
    id: 4,
    name: 'Suspicious Cough Syrup',
    manufacturer: 'Unknown',
    registrationNumber: 'RW-0004',
    barcode: '6001234567893',
    verifiedStatus: 'flagged',
  },
];

const SAMPLE_INGREDIENTS = [
  { id: 1, name: 'Paracetamol' },
  { id: 2, name: 'Amoxicillin' },
  { id: 3, name: 'Ibuprofen' },
];

/** medicine id -> ingredient ids (mirrors the MedicineIngredients table) */
const SAMPLE_MEDICINE_INGREDIENTS = { 1: [1], 2: [2], 3: [3], 4: [1, 3] };

function createFakeRepositories({ medicines = SAMPLE_MEDICINES } = {}) {
  const logs = [];
  const allergies = [];
  const reports = [];

  const medicineRepository = {
    async findByBarcode(barcode) {
      return medicines.find((m) => m.barcode === barcode) || null;
    },
    async findById(id) {
      return medicines.find((m) => m.id === id) || null;
    },
    async getIngredients(medicineId) {
      return (SAMPLE_MEDICINE_INGREDIENTS[medicineId] || []).map((id) =>
        SAMPLE_INGREDIENTS.find((i) => i.id === id),
      );
    },
  };

  const ingredientRepository = {
    async findById(id) {
      return SAMPLE_INGREDIENTS.find((i) => i.id === id) || null;
    },
    async list(query = '') {
      const q = query.toLowerCase();
      return SAMPLE_INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q));
    },
  };

  const userAllergyRepository = {
    async listByUser(userId) {
      return allergies.filter((a) => a.userId === userId).map(({ userId: _u, ...rest }) => rest);
    },
    async findByUserAndIngredient(userId, ingredientId) {
      const found = allergies.find((a) => a.userId === userId && a.ingredientId === ingredientId);
      return found || null;
    },
    async add(userId, ingredientId, severity) {
      const ingredient = SAMPLE_INGREDIENTS.find((i) => i.id === ingredientId);
      const id = allergies.length + 1;
      allergies.push({ id, userId, ingredientId, ingredient: ingredient.name, severity });
      return id;
    },
    async remove(userId, allergyId) {
      const index = allergies.findIndex((a) => a.id === allergyId && a.userId === userId);
      if (index === -1) return false;
      allergies.splice(index, 1);
      return true;
    },
  };

  const verificationLogRepository = {
    async create(entry) {
      logs.push(entry);
      return logs.length;
    },
  };

  const reportRepository = {
    async create({ userId = null, medicineId = null, description, location = null }) {
      const report = {
        id: reports.length + 1,
        userId,
        medicineId,
        description,
        location,
        status: 'new',
      };

      reports.push(report);

      return {
        id: report.id,
        status: report.status,
      };
    },
  };

  const users = [];
  const userRepository = {
    async findByEmail(email) {
      return users.find((u) => u.email === email) || null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) || null;
    },
    async create({ fullName, email, passwordHash }) {
      const user = { id: users.length + 1, fullName, email, passwordHash, role: 'user' };
      users.push(user);
      return { id: user.id, fullName, email, role: 'user' };
    },
  };

  return {
    medicineRepository,
    verificationLogRepository,
    reportRepository,
    userRepository,
    ingredientRepository,
    userAllergyRepository,
    _logs: logs,
    _users: users,
    _reports: reports,
  };
}

module.exports = { createFakeRepositories, SAMPLE_MEDICINES };
