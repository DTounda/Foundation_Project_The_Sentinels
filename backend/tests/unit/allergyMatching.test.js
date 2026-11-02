const { findAllergyMatches } = require('../../src/services/allergyService');

const paracetamol = { id: 1, name: 'Paracetamol' };
const amoxicillin = { id: 2, name: 'Amoxicillin' };
const ibuprofen = { id: 3, name: 'Ibuprofen' };

describe('findAllergyMatches', () => {
  it('returns nothing when no ingredient matches', () => {
    const alerts = findAllergyMatches(
      [paracetamol],
      [{ ingredientId: 2, ingredient: 'Amoxicillin', severity: 'severe' }],
    );
    expect(alerts).toEqual([]);
  });

  it('returns nothing when the user listed no allergies', () => {
    expect(findAllergyMatches([paracetamol, ibuprofen], [])).toEqual([]);
  });

  it('builds the approved allergy message with the ingredient name and severity', () => {
    const [alert] = findAllergyMatches(
      [amoxicillin],
      [{ ingredientId: 2, ingredient: 'Amoxicillin', severity: 'severe' }],
    );
    expect(alert).toEqual({
      ingredientId: 2,
      ingredient: 'Amoxicillin',
      severity: 'severe',
      message:
        'Contains Amoxicillin, which you listed as an allergy. Talk to your doctor or pharmacist before use.',
    });
  });

  it('reports every matching ingredient, most severe first', () => {
    const alerts = findAllergyMatches(
      [paracetamol, amoxicillin, ibuprofen],
      [
        { ingredientId: 1, severity: 'mild' },
        { ingredientId: 3, severity: 'severe' },
        { ingredientId: 2, severity: 'moderate' },
      ],
    );
    expect(alerts.map((a) => a.ingredient)).toEqual(['Ibuprofen', 'Amoxicillin', 'Paracetamol']);
  });

  it('does not alert on an ingredient the user is not allergic to', () => {
    const alerts = findAllergyMatches(
      [paracetamol, ibuprofen],
      [{ ingredientId: 3, severity: 'mild' }],
    );
    expect(alerts.map((a) => a.ingredient)).toEqual(['Ibuprofen']);
  });
});
