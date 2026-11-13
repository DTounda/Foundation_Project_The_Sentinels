const request = require('supertest');
const { createApp } = require('../../src/app');
const config = require('../../src/config/env');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

const API = '/api/v1';

function setup() {
  const repositories = createFakeRepositories();
  const app = createApp({ config: { ...config, bcryptRounds: 4 }, repositories });
  return { app, repositories };
}

describe('POST /api/v1/verify/medicine', () => {
  it('returns the result for the medicine the user picked', async () => {
    const { app, repositories } = setup();
    const res = await request(app).post(`${API}/verify/medicine`).send({ medicineId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('verified');
    expect(res.body.medicine).toMatchObject({ id: 1 });
    expect(res.body.disclaimer).toBeTruthy();
    expect(repositories._logs).toHaveLength(1);
  });

  it('adds allergy alerts for a logged-in user', async () => {
    const { app } = setup();
    const signup = await request(app)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Aline Uwase', email: 'aline@example.com', password: 'Str0ngPass!' });
    const auth = { Authorization: `Bearer ${signup.body.token}` };
    await request(app)
      .post(`${API}/allergies`)
      .set(auth)
      .send({ ingredientId: 1, severity: 'severe' });

    const res = await request(app).post(`${API}/verify/medicine`).set(auth).send({ medicineId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.allergyAlerts).toEqual([
      expect.objectContaining({ ingredientId: 1, severity: 'severe' }),
    ]);
  });

  it('returns 404 for an unknown medicine', async () => {
    const { app } = setup();
    const res = await request(app).post(`${API}/verify/medicine`).send({ medicineId: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 when medicineId is not a positive whole number', async () => {
    const { app } = setup();
    const res = await request(app).post(`${API}/verify/medicine`).send({ medicineId: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
