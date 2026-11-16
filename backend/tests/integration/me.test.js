const request = require('supertest');
const { createApp } = require('../../src/app');
const config = require('../../src/config/env');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

const testConfig = { ...config, bcryptRounds: 4 };
const API = '/api/v1';
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

function setup() {
  const repositories = createFakeRepositories();
  const app = createApp({ config: testConfig, repositories });
  return { app, repositories };
}

async function registerUser(app, email) {
  const response = await request(app)
    .post(`${API}/auth/register`)
    .send({
      firstName: 'Aline',
      lastName: 'Uwase',
      email,
      phone: '+250788000000',
      password: 'Str0ngPass!',
    });
  return { id: response.body.user.id, token: response.body.token };
}

describe('user profile', () => {
  it('deletes the account and its personal data', async () => {
    const { app, repositories } = setup();
    const alice = await registerUser(app, 'alice@example.com');
    const jean = await registerUser(app, 'jean@example.com');

    await request(app)
      .post(`${API}/allergies`)
      .set(bearer(alice.token))
      .send({ ingredientId: 1, severity: 'severe' });
    await request(app)
      .post(`${API}/me/medications`)
      .set(bearer(alice.token))
      .send({ name: 'Warfarin' });
    await request(app)
      .post(`${API}/reports`)
      .set(bearer(alice.token))
      .send({ medicineId: 1, description: 'Packaging looks different' });
    repositories._logs.push({
      userId: alice.id,
      medicineId: 1,
      method: 'scan',
      result: 'verified',
      createdAt: new Date(),
    });

    const deleted = await request(app).delete(`${API}/me`).set(bearer(alice.token));
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');

    expect((await request(app).get(`${API}/me`).set(bearer(alice.token))).status).toBe(401);
    expect(
      (await request(app).post(`${API}/auth/login`).send({
        email: 'alice@example.com',
        password: 'Str0ngPass!',
      })).status,
    ).toBe(401);
    expect((await request(app).get(`${API}/me`).set(bearer(jean.token))).status).toBe(200);
    expect(repositories._users).toHaveLength(1);
    expect(repositories._allergies).toEqual([]);
    expect(repositories._medications).toEqual([]);
    expect(repositories._logs[0].userId).toBeNull();
    expect(repositories._reports[0].userId).toBeNull();
  });

  it('requires authentication and returns the profile shape', async () => {
    const { app } = setup();
    expect((await request(app).get(`${API}/me`)).status).toBe(401);

    const { token } = await registerUser(app, 'aline@example.com');
    const response = await request(app).get(`${API}/me`).set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: 1,
        fullName: 'Aline Uwase',
        firstName: 'Aline',
        lastName: 'Uwase',
        email: 'aline@example.com',
        phone: '+250788000000',
      },
      doctor: null,
      pharmacy: null,
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('returns only the user\'s scan history and excludes search logs', async () => {
    const { app, repositories } = setup();
    const alice = await registerUser(app, 'alice@example.com');
    const jean = await registerUser(app, 'jean@example.com');
    const older = new Date('2026-11-15T10:00:00.000Z');
    const newer = new Date('2026-11-16T10:00:00.000Z');

    repositories._logs.push(
      { userId: alice.id, medicineId: 1, method: 'scan', result: 'verified', createdAt: older },
      { userId: alice.id, medicineId: 2, method: 'search', result: 'verified', createdAt: newer },
      { userId: alice.id, medicineId: 2, method: 'scan', result: 'unconfirmed', createdAt: newer },
      { userId: jean.id, medicineId: 3, method: 'scan', result: 'unconfirmed', createdAt: newer },
    );

    expect((await request(app).get(`${API}/me/history`)).status).toBe(401);
    const response = await request(app).get(`${API}/me/history`).set(bearer(alice.token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      history: [
        {
          date: newer.toISOString(),
          medicineName: 'Amoxicillin 250 mg capsules',
          result: 'unconfirmed',
        },
        {
          date: older.toISOString(),
          medicineName: 'Paracetamol 500 mg tablets',
          result: 'verified',
        },
      ],
    });
  });

  it('updates account, doctor and pharmacy data', async () => {
    const { app } = setup();
    const alice = await registerUser(app, 'aline@example.com');

    const account = await request(app)
      .put(`${API}/me/account`)
      .set(bearer(alice.token))
      .send({ fullName: 'Aline Uwase Smith', email: 'aline.smith@example.com', phone: '+250788000000' });
    expect(account.status).toBe(200);
    expect(account.body.user).toMatchObject({
      fullName: 'Aline Uwase Smith',
      firstName: 'Aline',
      lastName: 'Uwase Smith',
      email: 'aline.smith@example.com',
      phone: '+250788000000',
    });

    const doctor = await request(app)
      .put(`${API}/me/doctor`)
      .set(bearer(alice.token))
      .send({ name: 'Dr. Mutesi', phone: '+250788000001', email: 'doctor@example.com' });
    expect(doctor.body.doctor).toEqual({
      name: 'Dr. Mutesi',
      phone: '+250788000001',
      email: 'doctor@example.com',
    });

    const pharmacy = await request(app)
      .put(`${API}/me/pharmacy`)
      .set(bearer(alice.token))
      .send({ name: 'Kigali Pharmacy', phone: '+250788000002' });
    expect(pharmacy.body.pharmacy).toEqual({ name: 'Kigali Pharmacy', phone: '+250788000002' });
  });

  it('rejects duplicate account emails and invalid profile bodies', async () => {
    const { app } = setup();
    const alice = await registerUser(app, 'alice@example.com');
    await registerUser(app, 'jean@example.com');

    const conflict = await request(app)
      .put(`${API}/me/account`)
      .set(bearer(alice.token))
      .send({ fullName: 'Alice', email: 'jean@example.com', phone: '+250788000000' });
    expect(conflict.status).toBe(409);

    const invalid = await request(app)
      .put(`${API}/me/pharmacy`)
      .set(bearer(alice.token))
      .send({ name: 'Pharmacy' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('user medications', () => {
  it('supports full CRUD and enforces ownership', async () => {
    const { app } = setup();
    const alice = await registerUser(app, 'alice@example.com');
    const jean = await registerUser(app, 'jean@example.com');

    const created = await request(app)
      .post(`${API}/me/medications`)
      .set(bearer(alice.token))
      .send({ name: 'Warfarin' });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: 1, name: 'Warfarin' });

    const list = await request(app).get(`${API}/me/medications`).set(bearer(alice.token));
    expect(list.body).toEqual({ medications: [{ id: 1, name: 'Warfarin' }] });

    const update = await request(app)
      .put(`${API}/me/medications/1`)
      .set(bearer(alice.token))
      .send({ name: 'Apixaban' });
    expect(update.body).toEqual({ id: 1, name: 'Apixaban' });

    const attack = await request(app).get(`${API}/me/medications/1`).set(bearer(jean.token));
    expect(attack.status).toBe(404);
    expect(
      (await request(app).delete(`${API}/me/medications/1`).set(bearer(jean.token))).status,
    ).toBe(404);

    expect(
      (await request(app).delete(`${API}/me/medications/1`).set(bearer(alice.token))).status,
    ).toBe(204);
    expect((await request(app).get(`${API}/me/medications`).set(bearer(alice.token))).body).toEqual({
      medications: [],
    });
  });

  it.each([{}, { name: '' }, { name: 123 }])('rejects invalid medication body %j', async (body) => {
    const { app } = setup();
    const { token } = await registerUser(app, 'aline@example.com');
    const response = await request(app)
      .post(`${API}/me/medications`)
      .set(bearer(token))
      .send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
