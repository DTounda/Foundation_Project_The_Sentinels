const { normalize, similarity, findCandidates } = require('../../src/services/photoMatcher');

const MEDICINES = [
  { id: 1, name: 'Panadol', genericName: 'Paracetamol', manufacturer: 'GSK' },
  { id: 2, name: 'Augmentin 625 mg', genericName: 'Amoxicillin', manufacturer: 'GSK' },
  { id: 3, name: 'Brufen', genericName: 'Ibuprofen', manufacturer: 'Abbott' },
];

describe('photoMatcher', () => {
  it('normalizes case, accents, punctuation and stuck units', () => {
    expect(normalize('SÉBIONEX 500mg!')).toBe('sebionex 500 mg');
  });

  it('scores one misread letter close to 1, and unrelated words low', () => {
    expect(similarity('panadol', 'panad0l')).toBeGreaterThan(0.6);
    expect(similarity('panadol', 'brufen')).toBeLessThan(0.2);
  });

  it('finds the medicine despite OCR noise', () => {
    const [best] = findCandidates('PANAD0L Extra\nParacetamol 500mg', MEDICINES);
    expect(best.medicineId).toBe(1);
  });

  it('joins a word the OCR split in two', () => {
    const [best] = findCandidates('Amoxi cillin 500 mg', MEDICINES);
    expect(best.medicineId).toBe(2);
  });

  it('returns nothing when no medicine name is on the box', () => {
    expect(findCandidates('Batch 22 Exp 2027', MEDICINES)).toEqual([]);
  });

  it('never returns more than 5 candidates, best first', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Panadol ${i}` }));
    const result = findCandidates('Panadol', many);
    expect(result.length).toBe(5);
    const scores = result.map((c) => c.confidence);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});
