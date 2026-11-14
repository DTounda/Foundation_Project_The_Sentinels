const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakeRepositories } = require('../helpers/fakeRepositories');

// A real-looking base64 string; its content does not matter because OCR is faked.
const IMAGE = 'A'.repeat(200);

function setup(ocrText) {
  const ocrService = { readText: jest.fn(async () => ocrText) };
  const app = createApp({ repositories: createFakeRepositories(), ocrService });
  return { app, ocrService };
}

describe('POST /api/v1/verify/photo', () => {
  it('returns ranked candidates when the name is readable', async () => {
    const { app } = setup('PARACETAM0L 500mg\n20 tablets');
    const res = await request(app).post('/api/v1/verify/photo').send({ image: IMAGE });

    expect(res.status).toBe(200);
    expect(res.body.candidates.length).toBeGreaterThan(0);
    expect(res.body.candidates[0]).toMatchObject({ medicineId: 1 });
    expect(res.body.candidates[0].confidence).toBeGreaterThanOrEqual(0.6);
    expect(res.body.disclaimer).toBeTruthy();
  });

  it('returns 422 UNREADABLE when no text comes back', async () => {
    const { app } = setup('');
    const res = await request(app).post('/api/v1/verify/photo').send({ image: IMAGE });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('UNREADABLE');
  });

  it('returns 422 UNREADABLE when nothing matches a medicine', async () => {
    const { app } = setup('Batch 22 Exp 2027 Made in France');
    const res = await request(app).post('/api/v1/verify/photo').send({ image: IMAGE });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('UNREADABLE');
  });

  it('returns 503 with a clear message when the OCR service fails', async () => {
    const ocrService = { readText: jest.fn().mockRejectedValue(new Error('quota exceeded')) };
    const app = createApp({ repositories: createFakeRepositories(), ocrService });
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).post('/api/v1/verify/photo').send({ image: IMAGE });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toMatch(/search by name/);
    logger.mockRestore();
  });

  it('returns 400 and never calls OCR when the image is missing', async () => {
    const { app, ocrService } = setup('Paracetamol');
    const res = await request(app).post('/api/v1/verify/photo').send({});

    expect(res.status).toBe(400);
    expect(ocrService.readText).not.toHaveBeenCalled();
  });

  it('accepts a photo larger than the 10 KB limit of other endpoints', async () => {
    const { app } = setup('Paracetamol');
    const res = await request(app)
      .post('/api/v1/verify/photo')
      .send({ image: 'A'.repeat(500 * 1024) });

    expect(res.status).toBe(200);
  });
});
