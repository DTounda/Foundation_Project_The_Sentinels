const AppError = require('../utils/AppError');

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function publicProfile(user) {
  if (!user) throw AppError.notFound('User not found');
  const { firstName, lastName } = splitName(user.fullName);
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      firstName,
      lastName,
      email: user.email,
      phone: user.phone || null,
    },
    doctor: user.doctor || null,
    pharmacy: user.pharmacy || null,
  };
}

function createMeService({ userRepository }) {
  return {
    async getProfile(userId) {
      return publicProfile(await userRepository.findById(userId));
    },

    async updateAccount(userId, account) {
      const existing = await userRepository.findByEmail(account.email);
      if (existing && existing.id !== userId) {
        throw AppError.conflict('An account with this email already exists');
      }
      return publicProfile(await userRepository.updateAccount(userId, account));
    },

    async updateDoctor(userId, doctor) {
      const user = await userRepository.updateDoctor(userId, doctor);
      return { doctor: publicProfile(user).doctor };
    },

    async updatePharmacy(userId, pharmacy) {
      const user = await userRepository.updatePharmacy(userId, pharmacy);
      return { pharmacy: publicProfile(user).pharmacy };
    },
  };
}

module.exports = { createMeService, splitName };