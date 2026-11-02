/**
 * Approved wording shown to users. OWNER: Ephraim (finalise the text here).
 *
 * Rules agreed with Mr Apana's feedback: MediCheck INFORMS, it never INSTRUCTS.
 * Never write "take", "stop taking", "do not use" or any dosing advice in these strings.
 * The disclaimer must be sent with every result.
 */

const DISCLAIMER =
  "MediCheck gives information only. It doesn't replace advice from your doctor or pharmacist.";

const RESULT_MESSAGES = {
  verified: 'Verified: this product matches a registered, authentic record.',
  unconfirmed:
    'We could not confirm this product is authentic. Please check with your pharmacist and report it.',
  not_found: 'Not found in our records. Ask your pharmacist.',
};

function allergyMessage(ingredientName) {
  return `Contains ${ingredientName}, which you listed as an allergy. Talk to your doctor or pharmacist before use.`;
}

module.exports = { DISCLAIMER, RESULT_MESSAGES, allergyMessage };
