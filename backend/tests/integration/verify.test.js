const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakeRepositories } = require('../helpers/fakeRepositories');
const { DISCLAIMER, RESULT_MESSAGES } = require('../../src/messages/resultMessages');

function setup(overrides) {
  const repositories = createFakeRepositories();
  const app = createApp({ repositories: { ...repositories, ...overrides } });
  return { app, repositories };
}

describe('POST /api/v1/verify/barcode', () => {
  it('returns "verified" for a registered, verified medicine', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .send({ barcode: '6001234567890' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('verified');
    expect(res.body.message).toBe(RESULT_MESSAGES.verified);
    expect(res.body.medicine).toMatchObject({ id: 1, name: 'Paracetamol 500 mg tablets' });
    expect(res.body.allergyAlerts).toEqual([]);
    expect(res.body.disclaimer).toBe(DISCLAIMER);
  });

  it.each([
    ['unverified', '6001234567892'],
    ['flagged', '6001234567893'],
  ])('returns "unconfirmed" when the record is %s', async (_label, barcode) => {
    const { app } = setup();
    const res = await request(app).post('/api/v1/verify/barcode').send({ barcode });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('unconfirmed');
    expect(res.body.message).toBe(RESULT_MESSAGES.unconfirmed);
  });

  it('returns "not_found" with medicine null for an unknown barcode', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .send({ barcode: '9999999999999' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('not_found');
    expect(res.body.medicine).toBeNull();
    expect(res.body.disclaimer).toBe(DISCLAIMER);
  });

  it('saves every check in VerificationLogs, even anonymous ones', async () => {
    const { app, repositories } = setup();
    await request(app).post('/api/v1/verify/barcode').send({ barcode: '6001234567890' });
    await request(app).post('/api/v1/verify/barcode').send({ barcode: '9999999999999' });

    expect(repositories._logs).toEqual([
      { userId: null, medicineId: 1, method: 'scan', result: 'verified', allergyWarning: false },
      {
        userId: null,
        medicineId: null,
        method: 'scan',
        result: 'not_found',
        allergyWarning: false,
      },
    ]);
  });

  it('still answers when saving the log fails', async () => {
    const { app } = setup({
      verificationLogRepository: {
        create: async () => {
          throw new Error('db down');
        },
      },
    });
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .send({ barcode: '6001234567890' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('verified');
    logger.mockRestore();
  });

  it.each([
    [{}, 'missing barcode'],
    [{ barcode: 6001234567890 }, 'barcode sent as a number'],
    [{ barcode: '' }, 'empty barcode'],
    [{ barcode: "1'; DROP TABLE Medicines;--" }, 'SQL injection attempt'],
  ])('rejects %j (%s) with 400', async (body) => {
    const { app } = setup();
    const res = await request(app).post('/api/v1/verify/barcode').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed JSON with 400', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .set('Content-Type', 'application/json')
      .send('{"barcode": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 with a safe message when the database fails', async () => {
    const { app } = setup({
      medicineRepository: {
        findByBarcode: async () => {
          throw new Error('ECONNREFUSED secret-host:3306');
        },
      },
    });
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .send({ barcode: '6001234567890' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/secret-host/);
    logger.mockRestore();
  });
});
