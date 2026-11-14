/**
 * Approved wording shown to users. OWNER: Ephraim (finalise the text here).
 *
 * Rules agreed with Mr Apana's feedback: MediCheck INFORMS, it never INSTRUCTS.
 * Never write "take", "stop taking", "do not use" or any dosing advice in these strings.
 * The disclaimer must be sent with every result.
 */

const DISCLAIMER =
  "MediCheck gives information only. It doesn't replace advice from your doctor or pharmacist.";

// Shown when we have the medicine but not its ingredient list, so an empty allergy list
// is never mistaken for "no allergy risk".
const INGREDIENTS_UNKNOWN =
  "We don't have the ingredient list for this product, so we cannot check it against your allergies. Check with your pharmacist.";

const RESULT_MESSAGES = {
  verified:
    'Registered: this product is on the Rwanda FDA list of authorised medicines. Check the pack with your pharmacist if anything looks unusual.',
  unconfirmed:
    'We could not confirm this product is authentic. Please check with your pharmacist and report it.',
  not_found: 'Not found in our records. Ask your pharmacist.',
};

function allergyMessage(ingredientName) {
  return `Contains ${ingredientName}, which you listed as an allergy. Talk to your doctor or pharmacist before use.`;
}

module.exports = { DISCLAIMER, RESULT_MESSAGES, INGREDIENTS_UNKNOWN, allergyMessage };
