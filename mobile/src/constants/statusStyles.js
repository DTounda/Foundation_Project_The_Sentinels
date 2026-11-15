import { COLORS } from './colors';

// Visual style for each result status. The message text always comes from the API.
// Keys must match the status values in docs/API.md.
export const STATUS_STYLES = {
  verified: { label: 'Registered', color: COLORS.success, background: COLORS.successBg, icon: 'shieldCheck' },
  unconfirmed: { label: 'Could not confirm', color: COLORS.warning, background: COLORS.warningBg, icon: 'alert' },
  flagged: { label: 'Flagged', color: COLORS.danger, background: COLORS.dangerBg, icon: 'alert' },
  not_found: { label: 'Not found', color: COLORS.neutral, background: COLORS.neutralBg, icon: 'help' },
};

// Used when the API sends a status this app does not know yet.
export const FALLBACK_STATUS = { color: COLORS.neutral, background: COLORS.neutralBg, icon: 'help' };
