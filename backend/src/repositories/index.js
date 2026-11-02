const { createMedicineRepository } = require('./medicineRepository');
const { createUserRepository } = require('./userRepository');
const { createVerificationLogRepository } = require('./verificationLogRepository');

/** Wires every MySQL repository to one pool. Add new repositories here. */
function createMysqlRepositories(pool) {
  return {
    medicineRepository: createMedicineRepository(pool),
    verificationLogRepository: createVerificationLogRepository(pool),
    userRepository: createUserRepository(pool),
  };
}

module.exports = { createMysqlRepositories };
