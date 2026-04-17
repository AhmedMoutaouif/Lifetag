/**
 * JWT après login : mémoire + localStorage/sessionStorage.
 * Le token reste disponible jusqu'à la deconnexion explicite.
 */
const STORAGE_KEY = 'lifetag_session_jwt';

let accessToken = null;

export function setSessionAccessToken(token) {
  accessToken = typeof token === 'string' && token.length > 0 ? token : null;
  try {
    if (accessToken) {
      sessionStorage.setItem(STORAGE_KEY, accessToken);
      localStorage.setItem(STORAGE_KEY, accessToken);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* navigation privée / quota */
  }
}

export function getSessionAccessToken() {
  if (accessToken) return accessToken;
  try {
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (typeof s === 'string' && s.length > 0) {
      accessToken = s;
      return accessToken;
    }
    const l = localStorage.getItem(STORAGE_KEY);
    if (typeof l === 'string' && l.length > 0) {
      accessToken = l;
      return accessToken;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearSessionAccessToken() {
  accessToken = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
