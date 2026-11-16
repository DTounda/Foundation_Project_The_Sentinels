const { RESULT_MESSAGES, allergyMessage } = require('../../src/messages/resultMessages');

describe('approved result messages', () => {
  it('matches all four approved message forms', () => {
    expect(RESULT_MESSAGES.verified).toBe(
      'Registered: this product is on the Rwanda FDA list of authorised medicines. Check the pack with your pharmacist if anything looks unusual.',
    );
    expect(RESULT_MESSAGES.unconfirmed).toBe(
      'We could not confirm this product is FDA-registered. Please check with your pharmacist and report it.',
    );
    expect(RESULT_MESSAGES.not_found).toBe('Not found in our records. Ask your pharmacist.');
    expect(allergyMessage('Amoxicillin')).toBe(
      'Contains Amoxicillin, which you listed as an allergy. Talk to your doctor or pharmacist before use.',
    );
  });
});
