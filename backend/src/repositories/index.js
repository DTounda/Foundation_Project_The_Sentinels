const { createIngredientRepository } = require('./ingredientRepository');
const { createMedicineRepository } = require('./medicineRepository');
const { createUserAllergyRepository } = require('./userAllergyRepository');
const { createUserRepository } = require('./userRepository');
const { createVerificationLogRepository } = require('./verificationLogRepository');
const { createReportRepository } = require('./reportRepository');

const { createMongoMedicineRepository } = require('./mongo/medicineRepository');

const { createMongoIngredientRepository } = require('./mongo/ingredientRepository');

const { createMongoUserAllergyRepository } = require('./mongo/userAllergyRepository');

const { createMongoUserRepository } = require('./mongo/userRepository');

const { createMongoVerificationLogRepository } = require('./mongo/verificationLogRepository');

const { createMongoReportRepository } = require('./mongo/reportRepository');
const { createMongoUserMedicationRepository } = require('./mongo/userMedicationRepository');

function createMysqlRepositories(pool) {
  return {
    medicineRepository: createMedicineRepository(pool),
    verificationLogRepository: createVerificationLogRepository(pool),
    userRepository: createUserRepository(pool),
    ingredientRepository: createIngredientRepository(pool),
    userAllergyRepository: createUserAllergyRepository(pool),
    reportRepository: createReportRepository(pool),
  };
}

function createMongoRepositories(db) {
  return {
    medicineRepository: createMongoMedicineRepository(db),
    ingredientRepository: createMongoIngredientRepository(db),
    userAllergyRepository: createMongoUserAllergyRepository(db),
    userRepository: createMongoUserRepository(db),
    verificationLogRepository: createMongoVerificationLogRepository(db),
    reportRepository: createMongoReportRepository(db),
    userMedicationRepository: createMongoUserMedicationRepository(db),
  };
}

module.exports = {
  createMysqlRepositories,
  createMongoRepositories,
};
