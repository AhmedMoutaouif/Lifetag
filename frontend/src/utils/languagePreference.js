const COOKIE_NAME = 'lifetag_lang';
/** 1 an */
const MAX_AGE_SEC = 365 * 24 * 60 * 60;

export function getPreferredLanguage() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const raw = m ? decodeURIComponent(m[1].trim()) : '';
  const base = raw.split('-')[0].toLowerCase();
  return base === 'en' || base === 'fr' ? base : null;
}

/** Cookie de préférence (non httpOnly : nécessaire pour que i18n lise la langue au chargement). */
export function setPreferredLanguage(lng) {
  if (typeof document === 'undefined') return;
  const base = String(lng).split('-')[0].toLowerCase();
  if (base !== 'en' && base !== 'fr') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(base)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}
