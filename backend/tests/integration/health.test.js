const request = require('supertest');
const { createApp } = require('../../src/app');

describe('GET /api/v1/health', () => {
  it('returns 200 and database "up" when MySQL answers', async () => {
    const app = createApp({ checkDatabase: async () => true });
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'medicheck-api', database: 'up' });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns 503 and "degraded" when MySQL is unreachable', async () => {
    const app = createApp({ checkDatabase: async () => false });
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'degraded', database: 'down' });
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(createApp()).get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('answers unknown routes with the standard error shape', async () => {
    const res = await request(createApp()).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
