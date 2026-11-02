const request = require('supertest');
const { createApp } = require('../../src/app');
const config = require('../../src/config/env');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

const testConfig = { ...config, bcryptRounds: 4 };
const API = '/api/v1';
const DISCLAIMER =
  "MediCheck gives information only. It doesn't replace advice from your doctor or pharmacist.";

function setup() {
  const repositories = createFakeRepositories();
  const app = createApp({ config: testConfig, repositories });
  return { app, repositories };
}

async function registerUser(app, email = 'aline@example.com') {
  const res = await request(app)
    .post(`${API}/auth/register`)
    .send({ fullName: 'Aline Uwase', email, password: 'Str0ngPass!' });
  return { token: res.body.token, id: res.body.user.id };
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('GET /ingredients', () => {
  it('is public and filters by name', async () => {
    const { app } = setup();
    const res = await request(app).get(`${API}/ingredients?q=amox`);
    expect(res.status).toBe(200);
    expect(res.body.ingredients).toEqual([{ id: 2, name: 'Amoxicillin' }]);
  });
});

describe('allergy profile', () => {
  it('requires a token on every protected route', async () => {
    const { app } = setup();
    for (const [method, url] of [
      ['get', `${API}/allergies`],
      ['post', `${API}/allergies`],
      ['delete', `${API}/allergies/1`],
      ['get', `${API}/allergies/check?medicineId=1`],
    ]) {
      const res = await request(app)[method](url);
      expect(res.status).toBe(401);
    }
  });

  it('adds, lists and removes an allergy', async () => {
    const { app } = setup();
    const { token } = await registerUser(app);

    const created = await request(app)
      .post(`${API}/allergies`)
      .set(bearer(token))
      .send({ ingredientId: 2, severity: 'severe' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ingredientId: 2, ingredient: 'Amoxicillin' });

    const list = await request(app).get(`${API}/allergies`).set(bearer(token));
    expect(list.body.allergies).toHaveLength(1);

    const removed = await request(app)
      .delete(`${API}/allergies/${created.body.id}`)
      .set(bearer(token));
    expect(removed.status).toBe(204);

    const after = await request(app).get(`${API}/allergies`).set(bearer(token));
    expect(after.body.allergies).toEqual([]);
  });

  it('returns 409 when the ingredient is already listed and 404 for an unknown one', async () => {
    const { app } = setup();
    const { token } = await registerUser(app);
    const add = (body) => request(app).post(`${API}/allergies`).set(bearer(token)).send(body);

    await add({ ingredientId: 2, severity: 'mild' });
    expect((await add({ ingredientId: 2, severity: 'mild' })).status).toBe(409);
    expect((await add({ ingredientId: 999, severity: 'mild' })).status).toBe(404);
  });

  it.each([
    [{ ingredientId: 2, severity: 'deadly' }],
    [{ ingredientId: 'abc', severity: 'mild' }],
    [{ severity: 'mild' }],
    [{}],
  ])('returns 400 for invalid body %j', async (body) => {
    const { app } = setup();
    const { token } = await registerUser(app);
    const res = await request(app).post(`${API}/allergies`).set(bearer(token)).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it("never lets one user see or delete another user's allergies", async () => {
    const { app } = setup();
    const alice = await registerUser(app, 'alice@example.com');
    const jean = await registerUser(app, 'jean@example.com');

    const created = await request(app)
      .post(`${API}/allergies`)
      .set(bearer(alice.token))
      .send({ ingredientId: 2, severity: 'severe' });

    const jeanList = await request(app).get(`${API}/allergies`).set(bearer(jean.token));
    expect(jeanList.body.allergies).toEqual([]);

    const attack = await request(app)
      .delete(`${API}/allergies/${created.body.id}`)
      .set(bearer(jean.token));
    expect(attack.status).toBe(404);

    const aliceList = await request(app).get(`${API}/allergies`).set(bearer(alice.token));
    expect(aliceList.body.allergies).toHaveLength(1);
  });
});

describe('GET /allergies/check', () => {
  it('flags a medicine containing a listed ingredient', async () => {
    const { app } = setup();
    const { token } = await registerUser(app);
    await request(app)
      .post(`${API}/allergies`)
      .set(bearer(token))
      .send({ ingredientId: 2, severity: 'severe' });

    const res = await request(app).get(`${API}/allergies/check?medicineId=2`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.hasAlert).toBe(true);
    expect(res.body.allergyAlerts[0].message).toBe(
      'Contains Amoxicillin, which you listed as an allergy. Talk to your doctor or pharmacist before use.',
    );
    expect(res.body.disclaimer).toBe(DISCLAIMER);
  });

  it('reports no alert for a safe medicine, and 404 for an unknown medicine', async () => {
    const { app } = setup();
    const { token } = await registerUser(app);
    await request(app)
      .post(`${API}/allergies`)
      .set(bearer(token))
      .send({ ingredientId: 2, severity: 'severe' });

    const safe = await request(app).get(`${API}/allergies/check?medicineId=1`).set(bearer(token));
    expect(safe.body.hasAlert).toBe(false);

    const missing = await request(app)
      .get(`${API}/allergies/check?medicineId=999`)
      .set(bearer(token));
    expect(missing.status).toBe(404);
  });
});

describe('POST /verify/barcode with an allergy profile', () => {
  it('adds allergy alerts and logs allergy_warning for a logged-in user', async () => {
    const { app, repositories } = setup();
    const { token } = await registerUser(app);
    await request(app)
      .post(`${API}/allergies`)
      .set(bearer(token))
      .send({ ingredientId: 2, severity: 'severe' });

    const res = await request(app)
      .post(`${API}/verify/barcode`)
      .set(bearer(token))
      .send({ barcode: '6001234567891' }); // Amoxicillin capsules

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('verified');
    expect(res.body.allergyAlerts).toHaveLength(1);
    expect(res.body.allergyAlerts[0]).toMatchObject({
      ingredient: 'Amoxicillin',
      severity: 'severe',
    });
    expect(repositories._logs[0]).toMatchObject({ userId: 1, allergyWarning: true });
  });

  it('gives no alerts for anonymous users even when the medicine has the ingredient', async () => {
    const { app, repositories } = setup();
    const res = await request(app).post(`${API}/verify/barcode`).send({ barcode: '6001234567891' });
    expect(res.body.allergyAlerts).toEqual([]);
    expect(repositories._logs[0].allergyWarning).toBe(false);
  });

  it('still shows the allergy alert on an unconfirmed product', async () => {
    const { app } = setup();
    const { token } = await registerUser(app);
    await request(app)
      .post(`${API}/allergies`)
      .set(bearer(token))
      .send({ ingredientId: 3, severity: 'moderate' });

    const res = await request(app)
      .post(`${API}/verify/barcode`)
      .set(bearer(token))
      .send({ barcode: '6001234567892' }); // unverified ibuprofen

    expect(res.body.status).toBe('unconfirmed');
    expect(res.body.allergyAlerts).toHaveLength(1);
  });

  it('returns no alerts for a barcode that is not found', async () => {
    const { app } = setup();
    const { token } = await registerUser(app);
    const res = await request(app)
      .post(`${API}/verify/barcode`)
      .set(bearer(token))
      .send({ barcode: '0000000000000' });
    expect(res.body.status).toBe('not_found');
    expect(res.body.allergyAlerts).toEqual([]);
  });
});
