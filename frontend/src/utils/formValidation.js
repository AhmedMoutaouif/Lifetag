const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => typeof value === 'string' && EMAIL_RE.test(value.trim());

export const countPhoneDigits = (value) => (String(value || '').match(/\d/g) || []).length;

/** ICE / emergency line: at least 8 digits (international formats allowed). */
export const isValidEmergencyPhone = (value) => countPhoneDigits(value) >= 8;

export const isNonEmptyTrimmed = (value, minLen = 1) =>
  typeof value === 'string' && value.trim().length >= minLen;
