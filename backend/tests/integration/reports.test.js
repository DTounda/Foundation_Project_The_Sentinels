const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

const API = '/api/v1';

function setup() {
  const repositories = createFakeRepositories();
  const app = createApp({ repositories });

  return { app, repositories };
}

describe('POST /api/v1/reports', () => {
  it('creates an anonymous report without a medicineId', async () => {
    const { app, repositories } = setup();

    const res = await request(app).post(`${API}/reports`).send({
      description: 'Packaging looks different',
      location: 'Kimironko',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      report: {
        id: 1,
        status: 'new',
      },
    });

    expect(repositories._reports[0]).toMatchObject({
      userId: null,
      medicineId: null,
      description: 'Packaging looks different',
      location: 'Kimironko',
      status: 'new',
    });
  });

  it('creates a report linked to an existing medicine', async () => {
    const { app, repositories } = setup();

    const res = await request(app).post(`${API}/reports`).send({
      medicineId: 1,
      description: 'The packaging is damaged',
      location: 'Kigali',
    });

    expect(res.status).toBe(201);
    expect(repositories._reports[0].medicineId).toBe(1);
  });

  it('returns 404 for an unknown medicine', async () => {
    const { app } = setup();

    const res = await request(app).post(`${API}/reports`).send({
      medicineId: 999,
      description: 'This product looks suspicious',
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it.each([
    [{}, 'missing description'],
    [{ description: '1234' }, 'description too short'],
    [{ description: 'x'.repeat(1001) }, 'description too long'],
    [{ description: 'Valid report', location: 'x'.repeat(151) }, 'location too long'],
    [{ medicineId: 'abc', description: 'Valid report' }, 'invalid medicine id'],
  ])('returns 400 for %s', async (body) => {
    const { app } = setup();

    const res = await request(app).post(`${API}/reports`).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});