const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

const API = '/api/v1';

function setup() {
  const repositories = createFakeRepositories();
  const app = createApp({ repositories });

  return { app, repositories };
}

describe('GET /api/v1/medicines/:id', () => {
  it('returns medicine details with ingredients', async () => {
    const { app } = setup();

    const res = await request(app).get(`${API}/medicines/1`);

    expect(res.status).toBe(200);
    expect(res.body.medicine).toEqual({
      id: 1,
      name: 'Paracetamol 500 mg tablets',
      manufacturer: 'Example Pharma Ltd',
      registrationNumber: 'RW-0001',
      barcode: '6001234567890',
      verifiedStatus: 'verified',
    });
    expect(res.body.ingredients).toEqual([
      {
        id: 1,
        name: 'Paracetamol',
        strength: '500 mg',
      },
    ]);
    expect(res.body.disclaimer).toBeTruthy();
  });

  it('returns 404 for an unknown medicine', async () => {
    const { app } = setup();

    const res = await request(app).get(`${API}/medicines/999`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it.each(['/medicines/0', '/medicines/-1', '/medicines/abc', '/medicines/1.5'])(
    'returns 400 for an invalid medicine ID: %s',
    async (path) => {
      const { app } = setup();

      const res = await request(app).get(`${API}${path}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    },
  );
});