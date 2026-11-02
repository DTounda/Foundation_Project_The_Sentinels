// Sample data for local previews only. Field names follow the result shape in docs/API.md;
// adjust them here if the API contract changes. Remove once the real API is connected.
export const SAMPLE_RESULTS = {
  verified: {
    status: 'verified',
    message: 'Found in our records.',
    medicine: { name: 'Paracetamol 500 mg' },
    allergyAlerts: [],
  },
  unverified: {
    status: 'unverified',
    message: 'We could not confirm this product.',
    medicine: { name: 'Amoxicillin 250 mg' },
    allergyAlerts: [{ ingredient: 'Penicillin', severity: 'severe' }],
  },
  notFound: {
    status: 'not_found',
    message: 'Not in our records.',
    medicine: null,
    allergyAlerts: [],
  },
};
