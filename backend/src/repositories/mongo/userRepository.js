const AppError = require('../../utils/AppError');
const { nextId } = require('../counters');

function mapUser(document) {
  if (!document) return null;

  return {
    id: document.id,
    fullName: document.fullName,
    email: document.email,
    phone: document.phone || null,
    doctor: document.doctor || null,
    pharmacy: document.pharmacy || null,
    passwordHash: document.passwordHash,
    role: document.role,
  };
}

function createMongoUserRepository(db) {
  const users = db.collection('Users');

  return {
    async findByEmail(email) {
      const document = await users.findOne({
        email: String(email).trim().toLowerCase(),
      });

      return mapUser(document);
    },

    async findById(id) {
      const document = await users.findOne({
        id: Number(id),
      });

      return mapUser(document);
    },

    async updateAccount(userId, { fullName, email, phone }) {
      try {
        const result = await users.findOneAndUpdate(
          { id: Number(userId) },
          { $set: { fullName, email, phone } },
          { returnDocument: 'after' },
        );
        return mapUser(result);
      } catch (err) {
        if (err.code === 11000) {
          throw AppError.conflict('An account with this email already exists');
        }
        throw err;
      }
    },

    async updateDoctor(userId, doctor) {
      const result = await users.findOneAndUpdate(
        { id: Number(userId) },
        { $set: { doctor } },
        { returnDocument: 'after' },
      );
      return mapUser(result);
    },

    async updatePharmacy(userId, pharmacy) {
      const result = await users.findOneAndUpdate(
        { id: Number(userId) },
        { $set: { pharmacy } },
        { returnDocument: 'after' },
      );
      return mapUser(result);
    },

    async create({ fullName, email, passwordHash }) {
      const normalizedEmail = String(email).trim().toLowerCase();

      try {
        const id = await nextId(db, 'users');

        const user = {
          id,
          fullName,
          email: normalizedEmail,
          passwordHash,
          phone: null,
          doctor: null,
          pharmacy: null,
          role: 'user',
          createdAt: new Date(),
        };

        await users.insertOne(user);

        return {
          id,
          fullName,
          email: normalizedEmail,
          role: 'user',
        };
      } catch (err) {
        if (err.code === 11000) {
          throw AppError.conflict('An account with this email already exists');
        }

        throw err;
      }
    },
  };
}

module.exports = { createMongoUserRepository };
