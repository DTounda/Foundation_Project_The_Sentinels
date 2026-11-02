const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../src/app');
const config = require('../../src/config/env');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

const testConfig = { ...config, bcryptRounds: 4 };
const account = { fullName: 'Aline Uwase', email: 'aline@example.com', password: 'Str0ngPass!' };

function setup() {
  const repositories = createFakeRepositories();
  const app = createApp({ config: testConfig, repositories });
  return { app, repositories };
}

describe('POST /api/v1/auth/register', () => {
  it('creates an account, returns a token and never returns the password hash', async () => {
    const { app, repositories } = setup();
    const res = await request(app).post('/api/v1/auth/register').send(account);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      fullName: 'Aline Uwase',
      email: 'aline@example.com',
      role: 'user',
    });
    expect(typeof res.body.token).toBe('string');
    expect(JSON.stringify(res.body)).not.toMatch(/hash|\$2[aby]\$/);
    // stored as a bcrypt hash, not plain text
    expect(repositories._users[0].passwordHash).toMatch(/^\$2[aby]\$/);
    expect(repositories._users[0].passwordHash).not.toContain(account.password);
  });

  it('normalises the email and ignores a "role" sent by the client', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...account, email: '  ALINE@Example.com ', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('aline@example.com');
    expect(res.body.user.role).toBe('user');
  });

  it('returns 409 for a duplicate email', async () => {
    const { app } = setup();
    await request(app).post('/api/v1/auth/register').send(account);
    const res = await request(app).post('/api/v1/auth/register').send(account);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    [{ ...account, password: 'short' }, 'short password'],
    [{ ...account, email: 'nope' }, 'invalid email'],
    [{ ...account, fullName: '' }, 'empty name'],
    [{}, 'empty body'],
  ])('returns 400 for %j (%s)', async (body) => {
    const { app } = setup();
    const res = await request(app).post('/api/v1/auth/register').send(body);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with the right password', async () => {
    const { app } = setup();
    await request(app).post('/api/v1/auth/register').send(account);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ALINE@example.com', password: account.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('aline@example.com');
    const payload = jwt.verify(res.body.token, testConfig.jwt.secret);
    expect(payload.sub).toBe('1');
  });

  it('gives the same 401 message for a wrong password and an unknown email', async () => {
    const { app } = setup();
    await request(app).post('/api/v1/auth/register').send(account);

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: account.email, password: 'WrongPassword1' });
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPassword1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('token handling on an optional-auth route', () => {
  it('accepts anonymous requests', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .send({ barcode: '6001234567890' });
    expect(res.status).toBe(200);
  });

  it('records the user id in the log when a valid token is sent', async () => {
    const { app, repositories } = setup();
    const { body } = await request(app).post('/api/v1/auth/register').send(account);
    await request(app)
      .post('/api/v1/verify/barcode')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ barcode: '6001234567890' });

    expect(repositories._logs[0].userId).toBe(1);
  });

  it('rejects a bad token instead of silently treating the user as anonymous', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .set('Authorization', 'Bearer not.a.token')
      .send({ barcode: '6001234567890' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an expired token and a token signed with another secret', async () => {
    const { app } = setup();
    const expired = jwt.sign({ role: 'user' }, testConfig.jwt.secret, {
      subject: '1',
      expiresIn: -10,
    });
    const forged = jwt.sign({ role: 'admin' }, 'some-other-secret', { subject: '1' });

    for (const token of [expired, forged]) {
      const res = await request(app)
        .post('/api/v1/verify/barcode')
        .set('Authorization', `Bearer ${token}`)
        .send({ barcode: '6001234567890' });
      expect(res.status).toBe(401);
    }
  });

  it('rejects a malformed Authorization header', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/verify/barcode')
      .set('Authorization', 'Basic abc')
      .send({ barcode: '6001234567890' });
    expect(res.status).toBe(401);
  });
});
