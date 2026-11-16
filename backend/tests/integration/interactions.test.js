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

// Fixture ids (see tests/helpers/fakeRepositories.js):
// medicine 3 = Ibuprofen, medicine 5 = Warfex (Warfarin). Ibuprofen x Warfarin
// is a known Major interaction.
describe('GET /medicines/:id/interactions', () => {
  it('requires authentication', async () => {
    const { app } = setup();
    const response = await request(app).get(`${API}/medicines/3/interactions`);
    expect(response.status).toBe(401);
  });

  it('returns nothing when the user has not listed any current medications', async () => {
    const { app } = setup();
    const { token } = await registerUser(app, 'aline@example.com');

    const response = await request(app).get(`${API}/medicines/3/interactions`).set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ interactions: [] });
  });

  it('flags a known interaction with a current medication', async () => {
    const { app } = setup();
    const { token } = await registerUser(app, 'aline@example.com');

    await request(app).post(`${API}/me/medications`).set(bearer(token)).send({ name: 'Warfex' });

    const response = await request(app).get(`${API}/medicines/3/interactions`).set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.interactions).toEqual([
      {
        withMedicationName: 'Warfex',
        ingredient: 'Ibuprofen',
        withIngredient: 'Warfarin',
        level: 'Major',
      },
    ]);
  });

  it('says nothing when a current medication does not interact', async () => {
    const { app } = setup();
    const { token } = await registerUser(app, 'aline@example.com');

    // Amoxicillin (medicine 2) has no interaction with Ibuprofen in the fixtures.
    await request(app)
      .post(`${API}/me/medications`)
      .set(bearer(token))
      .send({ name: 'Amoxicillin 250 mg capsules' });

    const response = await request(app).get(`${API}/medicines/3/interactions`).set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ interactions: [] });
  });

  it('never reports a medicine as interacting with itself', async () => {
    const { app } = setup();
    const { token } = await registerUser(app, 'aline@example.com');

    // The user lists the exact medicine they are now checking.
    await request(app)
      .post(`${API}/me/medications`)
      .set(bearer(token))
      .send({ name: 'Ibuprofen 400 mg tablets' });

    const response = await request(app).get(`${API}/medicines/3/interactions`).set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ interactions: [] });
  });

  it('ignores a medication name that matches nothing we carry', async () => {
    const { app } = setup();
    const { token } = await registerUser(app, 'aline@example.com');

    await request(app)
      .post(`${API}/me/medications`)
      .set(bearer(token))
      .send({ name: 'Some Unknown Tonic' });

    const response = await request(app).get(`${API}/medicines/3/interactions`).set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ interactions: [] });
  });
});
