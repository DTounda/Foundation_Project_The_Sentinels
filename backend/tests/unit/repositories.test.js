const { createUserRepository } = require('../../src/repositories/userRepository');
const { createUserAllergyRepository } = require('../../src/repositories/userAllergyRepository');
const AppError = require('../../src/utils/AppError');

// A pool whose execute() fails the way mysql2 does when a UNIQUE index is hit.
function poolThatThrows(code) {
  return {
    async execute() {
      const err = new Error('driver error');
      err.code = code;
      throw err;
    },
  };
}

describe('duplicate keys are turned into 409 inside the repositories', () => {
  it('userRepository.create throws a conflict when the email is taken', async () => {
    const users = createUserRepository(poolThatThrows('ER_DUP_ENTRY'));
    const attempt = users.create({
      fullName: 'Aline',
      email: 'aline@example.com',
      passwordHash: 'x',
    });

    await expect(attempt).rejects.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('userAllergyRepository.add throws a conflict for the same allergy twice', async () => {
    const allergies = createUserAllergyRepository(poolThatThrows('ER_DUP_ENTRY'));

    await expect(allergies.add(1, 2, 'severe')).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('other database errors are passed on unchanged', async () => {
    const users = createUserRepository(poolThatThrows('ECONNREFUSED'));
    const attempt = users.create({
      fullName: 'Aline',
      email: 'aline@example.com',
      passwordHash: 'x',
    });

    await expect(attempt).rejects.not.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toMatchObject({ code: 'ECONNREFUSED' });
  });
});
