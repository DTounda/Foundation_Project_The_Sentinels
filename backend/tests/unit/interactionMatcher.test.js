const { normalizeDrugName, resolveIngredientId } = require('../../src/services/interactionMatcher');

describe('normalizeDrugName', () => {
  it('trims and lowercases', () => {
    expect(normalizeDrugName('  Acetaminophen  ')).toBe('acetaminophen');
  });

  it('treats a missing name as empty', () => {
    expect(normalizeDrugName(undefined)).toBe('');
  });
});

describe('resolveIngredientId', () => {
  const nameKeyToIngredient = new Map([
    ['paracetamol', { ingredientId: 1, name: 'Paracetamol' }],
    ['ibuprofen', { ingredientId: 2, name: 'Ibuprofen' }],
  ]);

  it('matches a direct name', () => {
    expect(resolveIngredientId('Ibuprofen', nameKeyToIngredient)).toBe(2);
  });

  it('matches a DDInter US name through the synonym list', () => {
    // DDInter calls paracetamol "Acetaminophen".
    expect(resolveIngredientId('Acetaminophen', nameKeyToIngredient)).toBe(1);
  });

  it('returns null for an ingredient we do not carry', () => {
    expect(resolveIngredientId('Some Unknown Drug', nameKeyToIngredient)).toBeNull();
  });

  it('returns null for an empty name', () => {
    expect(resolveIngredientId('', nameKeyToIngredient)).toBeNull();
  });
});
