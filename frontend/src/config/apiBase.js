/** Base URL for API calls. In Vite dev, empty string → same origin + `/api` proxy. */
export const API_BASE_URL =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.trim()
    ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : '';
