const {
  parseBarcode,
  parsePositiveInt,
  parseEmail,
  parsePassword,
  parseSeverity,
  parseReportDescription,
  parseOptionalLocation,
} = require('../../src/utils/validators');

describe('parseBarcode', () => {
  it('trims and accepts a normal EAN-13', () => {
    expect(parseBarcode(' 6001234567890 ')).toBe('6001234567890');
  });

  it.each([
    undefined,
    null,
    123,
    '',
    '   ',
    'abc',
    "1234'; DROP TABLE Medicines;--",
    'x'.repeat(51),
  ])('rejects %p', (value) => {
    expect(() => parseBarcode(value)).toThrow(/barcode/);
  });
});

describe('parsePositiveInt', () => {
  it('accepts numbers and numeric strings', () => {
    expect(parsePositiveInt(5, 'id')).toBe(5);
    expect(parsePositiveInt('12', 'id')).toBe(12);
  });

  it.each([0, -1, 1.5, 'abc', '1.5', null, undefined, '1; DROP'])('rejects %p', (value) => {
    expect(() => parsePositiveInt(value, 'id')).toThrow(/id must be/);
  });
});

describe('parseEmail / parsePassword / parseSeverity', () => {
  it('lowercases and trims the email', () => {
    expect(parseEmail('  Aline@Example.COM ')).toBe('aline@example.com');
  });

  it('rejects invalid emails', () => {
    expect(() => parseEmail('not-an-email')).toThrow();
    expect(() => parseEmail(42)).toThrow();
  });

  it('requires a password of 8 to 72 characters', () => {
    expect(parsePassword('longenough')).toBe('longenough');
    expect(() => parsePassword('short')).toThrow();
    expect(() => parsePassword('x'.repeat(73))).toThrow();
  });

  it('only accepts the three severities from the schema', () => {
    expect(parseSeverity('severe')).toBe('severe');
    expect(() => parseSeverity('deadly')).toThrow();
  });
});

describe('report validators', () => {
  it('accepts and trims a valid description', () => {
    expect(parseReportDescription('  Packaging looks different  ')).toBe(
      'Packaging looks different',
    );
  });

  it.each([undefined, null, '', '1234', 'x'.repeat(1001)])(
    'rejects invalid description %p',
    (value) => {
      expect(() => parseReportDescription(value)).toThrow(/description/);
    },
  );

  it('returns null when location is omitted', () => {
    expect(parseOptionalLocation(undefined)).toBeNull();
  });

  it('accepts and trims a valid location', () => {
    expect(parseOptionalLocation('  Kimironko  ')).toBe('Kimironko');
  });

  it('rejects a location longer than 150 characters', () => {
    expect(() => parseOptionalLocation('x'.repeat(151))).toThrow(/location/);
  });
});

