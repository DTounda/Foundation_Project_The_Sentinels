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
  {
    id: 5,
    name: 'Warfex 5 mg tablets',
    manufacturer: 'Example Pharma Ltd',
    registrationNumber: 'RW-0005',
    barcode: '6001234567894',
    verifiedStatus: 'verified',
  },
];

const SAMPLE_INGREDIENTS = [
  { id: 1, name: 'Paracetamol', strength: '500 mg' },
  { id: 2, name: 'Amoxicillin', strength: '250 mg' },
  { id: 3, name: 'Ibuprofen', strength: '400 mg' },
  { id: 4, name: 'Warfarin', strength: '5 mg' },
];

/** medicine id -> ingredient ids (mirrors the MedicineIngredients table) */
const SAMPLE_MEDICINE_INGREDIENTS = {
  1: [1],
  2: [2],
  3: [3],
  4: [1, 3],
  5: [4],
};

/** A known Major interaction used by the interactions tests: ibuprofen x warfarin. */
const SAMPLE_INTERACTIONS = [{ ingredientIdA: 3, ingredientIdB: 4, level: 'Major' }];

function createFakeRepositories({
  medicines = SAMPLE_MEDICINES,
  interactions: interactionPairs = SAMPLE_INTERACTIONS,
} = {}) {
  const logs = [];
  const allergies = [];
  const reports = [];

  const medicineRepository = {
    async searchByName(query) {
      const search = query.toLowerCase();

      return medicines.filter((medicine) => medicine.name.toLowerCase().includes(search));
    },

    async listForMatching() {
      return medicines.map(({ id, name, manufacturer }) => ({
        id,
        name,
        manufacturer,
      }));
    },

    async findByBarcode(barcode) {
      return medicines.find((medicine) => medicine.barcode === barcode) || null;
    },

    async findById(id) {
      return medicines.find((medicine) => medicine.id === id) || null;
    },

    async getIngredients(medicineId) {
      return (SAMPLE_MEDICINE_INGREDIENTS[medicineId] || []).map((id) => {
        const ingredient = SAMPLE_INGREDIENTS.find((item) => item.id === id);

        return {
          id: ingredient.id,
          name: ingredient.name,
          strength: ingredient.strength,
        };
      });
    },

    async getIngredientsForMedicines(medicineIds) {
      const results = new Map();

      for (const medicineId of medicineIds) {
        const ingredientIds = SAMPLE_MEDICINE_INGREDIENTS[medicineId] || [];

        const ingredients = ingredientIds.map((id) => {
          const ingredient = SAMPLE_INGREDIENTS.find((item) => item.id === id);

          return {
            id: ingredient.id,
            name: ingredient.name,
            strength: ingredient.strength,
          };
        });

        results.set(Number(medicineId), ingredients);
      }

      return results;
    },
  };

  const ingredientRepository = {
    async findById(id) {
      return SAMPLE_INGREDIENTS.find((ingredient) => ingredient.id === id) || null;
    },

    async list(query = '') {
      const search = query.toLowerCase();

      return SAMPLE_INGREDIENTS.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(search),
      ).map(({ id, name }) => ({ id, name }));
    },
  };

  const userAllergyRepository = {
    async listByUser(userId) {
      return allergies
        .filter((allergy) => allergy.userId === userId)
        .map(({ userId: _userId, ...rest }) => rest);
    },

    async findByUserAndIngredient(userId, ingredientId) {
      return (
        allergies.find(
          (allergy) => allergy.userId === userId && allergy.ingredientId === ingredientId,
        ) || null
      );
    },

    async add(userId, ingredientId, severity) {
      const ingredient = SAMPLE_INGREDIENTS.find((item) => item.id === ingredientId);
      const id = allergies.length + 1;

      allergies.push({
        id,
        userId,
        ingredientId,
        ingredient: ingredient.name,
        severity,
      });

      return id;
    },

    async remove(userId, allergyId) {
      const index = allergies.findIndex(
        (allergy) => allergy.id === allergyId && allergy.userId === userId,
      );

      if (index === -1) return false;

      allergies.splice(index, 1);
      return true;
    },
  };

  const verificationLogRepository = {
    async create(entry) {
      const log = { ...entry };
      Object.defineProperty(log, 'createdAt', {
        value: entry.createdAt || new Date(),
        enumerable: false,
      });
      logs.push(log);
      return logs.length;
    },

    async listByUser(userId) {
      return logs
        .filter((entry) => entry.userId === userId && entry.method === 'scan')
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((entry) => ({
          date: entry.createdAt,
          medicineName: medicines.find((medicine) => medicine.id === entry.medicineId)?.name || null,
          result: entry.result,
        }));
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
  const medications = [];

  const userRepository = {
    async findByEmail(email) {
      return users.find((user) => user.email === email) || null;
    },

    async findById(id) {
      return users.find((user) => user.id === id) || null;
    },

    async updateAccount(userId, { fullName, email, phone }) {
      const user = users.find((item) => item.id === userId);
      if (!user) return null;
      if (users.some((item) => item.id !== userId && item.email === email)) {
        const error = new Error('duplicate email');
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }
      Object.assign(user, { fullName, email, phone });
      return { ...user };
    },

    async updateDoctor(userId, doctor) {
      const user = users.find((item) => item.id === userId);
      if (!user) return null;
      user.doctor = doctor;
      return { ...user };
    },

    async updatePharmacy(userId, pharmacy) {
      const user = users.find((item) => item.id === userId);
      if (!user) return null;
      user.pharmacy = pharmacy;
      return { ...user };
    },

    async create({ fullName, email, phone, passwordHash }) {
      const user = {
        id: users.length + 1,
        fullName,
        email,
        passwordHash,
        phone,
        doctor: null,
        pharmacy: null,
        role: 'user',
      };

      users.push(user);

      return {
        id: user.id,
        fullName,
        email,
        phone,
        role: 'user',
      };
    },
  };

  const userMedicationRepository = {
    async listByUser(userId) {
      return medications
        .filter((medication) => medication.userId === userId)
        .map(({ medicationId: id, name }) => ({ id, name }));
    },

    async findByUser(userId, medicationId) {
      const medication = medications.find(
        (item) => item.userId === userId && item.medicationId === medicationId,
      );
      return medication ? { id: medication.medicationId, name: medication.name } : null;
    },

    async create(userId, name) {
      const medication = { medicationId: medications.length + 1, userId, name };
      medications.push(medication);
      return { id: medication.medicationId, name };
    },

    async update(userId, medicationId, name) {
      const medication = medications.find(
        (item) => item.userId === userId && item.medicationId === medicationId,
      );
      if (!medication) return null;
      medication.name = name;
      return { id: medication.medicationId, name };
    },

    async remove(userId, medicationId) {
      const index = medications.findIndex(
        (item) => item.userId === userId && item.medicationId === medicationId,
      );
      if (index === -1) return false;
      medications.splice(index, 1);
      return true;
    },
  };

  const interactionRepository = {
    async findBetweenIngredientSets(idsA, idsB) {
      const a = new Set((idsA || []).map(Number));
      const b = new Set((idsB || []).map(Number));

      return interactionPairs.filter(
        (pair) =>
          (a.has(pair.ingredientIdA) && b.has(pair.ingredientIdB)) ||
          (a.has(pair.ingredientIdB) && b.has(pair.ingredientIdA)),
      );
    },
  };

  return {
    medicineRepository,
    verificationLogRepository,
    reportRepository,
    userRepository,
    ingredientRepository,
    userAllergyRepository,
    userMedicationRepository,
    interactionRepository,
    _logs: logs,
    _users: users,
    _reports: reports,
  };
}

module.exports = { createFakeRepositories, SAMPLE_MEDICINES };
