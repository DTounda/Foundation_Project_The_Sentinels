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

function createFakeRepositories({ medicines = SAMPLE_MEDICINES } = {}) {
  const logs = [];

  const medicineRepository = {
    async findByBarcode(barcode) {
      return medicines.find((m) => m.barcode === barcode) || null;
    },
    async findById(id) {
      return medicines.find((m) => m.id === id) || null;
    },
    async getIngredients() {
      return [];
    },
  };

  const verificationLogRepository = {
    async create(entry) {
      logs.push(entry);
      return logs.length;
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
    userRepository,
    _logs: logs,
    _users: users,
  };
}

module.exports = { createFakeRepositories, SAMPLE_MEDICINES };
