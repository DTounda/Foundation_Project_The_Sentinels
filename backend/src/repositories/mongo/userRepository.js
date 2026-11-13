const AppError = require('../../utils/AppError');
const { nextId } = require('../counters');

function mapUser(document) {
  if (!document) return null;

  return {
    id: document.id,
    fullName: document.fullName,
    email: document.email,
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

    async create({ fullName, email, passwordHash }) {
      const normalizedEmail = String(email).trim().toLowerCase();

      try {
        const id = await nextId(db, 'users');

        const user = {
          id,
          fullName,
          email: normalizedEmail,
          passwordHash,
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
