const { classifyMedicine, buildResult, STATUS } = require('../../src/services/resultBuilder');
const { DISCLAIMER, RESULT_MESSAGES } = require('../../src/messages/resultMessages');

const base = {
  id: 1,
  name: 'Paracetamol 500 mg tablets',
  manufacturer: 'Example Pharma Ltd',
  registrationNumber: 'RW-0001',
  barcode: '6001234567890',
};

describe('classifyMedicine', () => {
  it('is "verified" only when the record says verified', () => {
    expect(classifyMedicine({ ...base, verifiedStatus: 'verified' })).toBe(STATUS.VERIFIED);
  });

  it.each(['unverified', 'flagged'])('is "unconfirmed" when status is %s', (verifiedStatus) => {
    expect(classifyMedicine({ ...base, verifiedStatus })).toBe(STATUS.UNCONFIRMED);
  });

  it('is "not_found" when there is no record', () => {
    expect(classifyMedicine(null)).toBe(STATUS.NOT_FOUND);
  });

  it('never trusts an unexpected value as verified', () => {
    expect(classifyMedicine({ ...base, verifiedStatus: 'VERIFIED ' })).toBe(STATUS.UNCONFIRMED);
    expect(classifyMedicine({ ...base })).toBe(STATUS.UNCONFIRMED);
  });
});

describe('buildResult', () => {
  it('always includes the information-only disclaimer', () => {
    for (const medicine of [null, { ...base, verifiedStatus: 'verified' }]) {
      expect(buildResult(medicine).disclaimer).toBe(DISCLAIMER);
    }
  });

  it('uses the approved message for each status', () => {
    expect(buildResult(null).message).toBe(RESULT_MESSAGES.not_found);
    expect(buildResult({ ...base, verifiedStatus: 'flagged' }).message).toBe(
      RESULT_MESSAGES.unconfirmed,
    );
  });

  it('does not leak the internal verifiedStatus field', () => {
    const { medicine } = buildResult({ ...base, verifiedStatus: 'verified' });
    expect(medicine).not.toHaveProperty('verifiedStatus');
    expect(medicine.name).toBe(base.name);
  });

  it('approved messages inform and never instruct (Mr Apana feedback)', () => {
    const forbidden = /\b(take|stop taking|do not use|don't use|discard|swallow)\b/i;
    for (const text of Object.values(RESULT_MESSAGES)) {
      expect(text).not.toMatch(forbidden);
    }
  });
});
