// DDInter (the interaction data source) uses US/international drug names, which
// sometimes differ from the names in our own Ingredients collection. This is the
// only place that bridges the two name sets.
const SYNONYMS = {
  acetaminophen: 'paracetamol',
  albuterol: 'salbutamol',
  epinephrine: 'adrenaline',
  norepinephrine: 'noradrenaline',
  'acetylsalicylic acid': 'aspirin',
};

/** "Acetaminophen" -> "acetaminophen" (trim + lowercase, nothing else: these are plain drug names). */
function normalizeDrugName(name) {
  return String(name || '')
    .trim()
    .toLowerCase();
}

/**
 * Maps a DDInter drug name to one of our ingredient ids, or null if we don't
 * carry that ingredient. `nameKeyToIngredient` is a Map built from our own
 * Ingredients collection: nameKey -> { ingredientId, name }.
 */
function resolveIngredientId(drugName, nameKeyToIngredient) {
  const key = normalizeDrugName(drugName);
  if (!key) return null;

  const direct = nameKeyToIngredient.get(key);
  if (direct) return direct.ingredientId;

  const synonym = SYNONYMS[key];
  if (synonym) {
    const viaSynonym = nameKeyToIngredient.get(synonym);
    if (viaSynonym) return viaSynonym.ingredientId;
  }

  return null;
}

module.exports = { normalizeDrugName, resolveIngredientId, SYNONYMS };
