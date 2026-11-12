const { createIngredientRepository } = require('./ingredientRepository');
const { createMedicineRepository } = require('./medicineRepository');
const { createUserAllergyRepository } = require('./userAllergyRepository');
const { createUserRepository } = require('./userRepository');
const { createVerificationLogRepository } = require('./verificationLogRepository');
const { createReportRepository } = require('./reportRepository');

/** Wires every MySQL repository to one pool. Add new repositories here. */
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

/**
 * MongoDB versions of the repositories, with the same method names and return shapes
 * as the MySQL ones, so nothing above this layer changes.
 * Olivier: medicine, ingredient, userAllergy. Ephraim: user, report, verificationLog.
 * Each file goes in repositories/mongo/ and is added here when it is ready.
 */
// Rename _db to db when the first Mongo repository is added below.
function createMongoRepositories(_db) {
  return {
    // medicineRepository: createMongoMedicineRepository(db),
  };
}

module.exports = { createMysqlRepositories, createMongoRepositories };
