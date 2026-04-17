import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import i18n from '../i18n';
import { swalSessionExpired } from '../utils/swalLifeTag';
import { API_BASE_URL } from '../config/apiBase';
import { setSessionAccessToken, clearSessionAccessToken } from '../utils/sessionAccessToken';

export const AuthContext = createContext(null);

const SESSION_MS = 8 * 60 * 60 * 1000;
const SESSION_KEY = 'lifetag_session_expires_at';

export const AuthProvider = ({ children }) => {
  /** Ne pas hydrater depuis localStorage : évite redirection /dashboard sans JWT puis 401 → déconnexion. */
  const [user, setUser] = useState(null);
  /** JWT principal : cookie httpOnly ; plus de stockage localStorage du token. */
  const [sessionReady, setSessionReady] = useState(false);

  const logout = useCallback(async () => {
    clearSessionAccessToken();
    try {
      await axios.post(`${API_BASE_URL}/api/logout`);
    } catch {
      /* ignore */
    }
    setUser(null);
    setSessionReady(true);
    localStorage.removeItem('lifetag_user');
    localStorage.removeItem('lifetag_token');
    localStorage.removeItem(SESSION_KEY);
  }, []);

  /** Expiration session 8 h : déconnexion automatique. */
  const checkSessionExpiry = useCallback(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    if (Date.now() > Number(raw)) {
      void (async () => {
        await swalSessionExpired(i18n.t('auth.session_expired')).catch(() => {});
        await logout();
        window.location.assign('/login');
      })();
    }
  }, [logout]);

  /** Expired or invalid JWT → API returns 401; clear stale local session so user can re-login. */
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status !== 401) return Promise.reject(error);
        const url = String(error.config?.url || '');
        if (/\/api\/login\b/.test(url) || /\/api\/register\b/.test(url) || /\/api\/logout\b/.test(url)) {
          return Promise.reject(error);
        }
        if (localStorage.getItem('lifetag_user')) {
          void logout();
          window.location.assign('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [logout]);

  /** Au chargement : session via cookie httpOnly (plus de Bearer en localStorage). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`);
        if (!cancelled && data.user) {
          setUser(data.user);
          localStorage.setItem('lifetag_user', JSON.stringify(data.user));
          if (!localStorage.getItem(SESSION_KEY)) {
            localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
          }
        }
      } catch (e) {
        if (!cancelled && e.response?.status === 401) {
          clearSessionAccessToken();
          localStorage.removeItem('lifetag_user');
          localStorage.removeItem('lifetag_token');
          setUser(null);
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    checkSessionExpiry();
    const id = setInterval(checkSessionExpiry, 60_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') checkSessionExpiry();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user, checkSessionExpiry]);

  const login = (userData, jwt = null) => {
    if (jwt) setSessionAccessToken(jwt);
    setUser(userData);
    setSessionReady(true);
    localStorage.setItem('lifetag_user', JSON.stringify(userData));
    localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_MS));
  };

  const updateUserInfo = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('lifetag_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token: null, sessionReady, login, logout, updateUserInfo, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
