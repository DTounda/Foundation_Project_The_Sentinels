/**
 * Converts the API result into the shape the Result screen uses.
 * If docs/API.md names a field differently, change it HERE and nowhere else.
 *
 * Assumed API shape: { status, message, medicine: { id, name }, allergyAlerts: [{ ingredient, severity }] }
 */
export function normalizeResult(apiResult) {
  if (!apiResult) {
    return null;
  }
  return {
    status: apiResult.status,
    message: apiResult.message ?? '',
    medicineId: apiResult.medicine?.id ?? null,
    medicineName: apiResult.medicine?.name ?? null,
    allergyAlerts: Array.isArray(apiResult.allergyAlerts) ? apiResult.allergyAlerts : [],
  };
}
