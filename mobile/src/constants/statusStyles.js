// Visual style for each result status. The message text itself always comes from the API
// (backend/src/messages/resultMessages.js), so the app never writes its own medical wording.
// Keys must match the status values in docs/API.md.
export const STATUS_STYLES = {
  verified: { label: 'Verified', color: '#1B7F3B', background: '#DDF5E4' },
  unverified: { label: 'Could not confirm', color: '#8A5A00', background: '#FFF4D6' },
  flagged: { label: 'Flagged', color: '#B42318', background: '#FDECEA' },
  not_found: { label: 'Not found', color: '#475467', background: '#EEF1F4' },
};

// Used when the API sends a status this app does not know yet.
export const FALLBACK_STATUS = { color: '#475467', background: '#EEF1F4' };
