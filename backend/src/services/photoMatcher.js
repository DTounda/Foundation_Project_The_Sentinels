// Words on the box that say nothing about which medicine it is.
const IGNORED_WORDS = new Set([
  'tablets',
  'tablet',
  'capsules',
  'capsule',
  'syrup',
  'oral',
  'suspension',
  'injection',
  'cream',
]);

/** "PANADOL 500mg!" -> "panadol 500 mg" */
function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The words of a medicine name that identify it: no numbers, no "tablets". */
function nameWords(name) {
  return normalize(name)
    .split(' ')
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !IGNORED_WORDS.has(w));
}

/** Every word read from the photo, plus each pair joined ("amoxi cillin" -> "amoxicillin"). */
function ocrTokens(text) {
  const list = normalize(text).split(' ').filter(Boolean);
  const tokens = new Set(list);
  for (let i = 0; i < list.length - 1; i += 1) tokens.add(list[i] + list[i + 1]);
  return [...tokens].filter((t) => t.length >= 3);
}

/** "panadol" -> { pa, an, na, ad, do, ol } */
function bigrams(word) {
  const set = new Set();
  for (let i = 0; i < word.length - 1; i += 1) set.add(word.slice(i, i + 2));
  return set;
}

/** 1 = same word, 0 = nothing in common. One misread letter still scores high. */
function similarity(a, b) {
  if (a === b) return 1;
  const pairsA = bigrams(a);
  const pairsB = bigrams(b);
  let shared = 0;
  for (const pair of pairsA) if (pairsB.has(pair)) shared += 1;
  return (2 * shared) / (pairsA.size + pairsB.size);
}

/** Average, over the words of the name, of the best match found on the photo. */
function nameScore(name, tokens) {
  const words = nameWords(name);
  if (words.length === 0) return 0;
  const total = words.reduce((sum, w) => sum + Math.max(...tokens.map((t) => similarity(w, t))), 0);
  return total / words.length;
}

/**
 * Ranks medicines by how well their brand or generic name matches the photo text.
 * Never one verdict: up to `limit` candidates, best first, for the user to pick from.
 */
function findCandidates(text, medicines, { limit = 5, threshold = 0.6 } = {}) {
  const tokens = ocrTokens(text);
  if (tokens.length === 0) return [];
  return medicines
    .map((m) => ({
      m,
      score: Math.max(nameScore(m.name, tokens), nameScore(m.genericName, tokens)),
    }))
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ m, score }) => ({
      medicineId: m.id,
      name: m.name,
      manufacturer: m.manufacturer,
      confidence: Math.round(score * 100) / 100,
    }));
}

module.exports = { normalize, similarity, findCandidates };
