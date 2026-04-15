import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lifetag_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lifetag_token') || null);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lifetag_user');
    localStorage.removeItem('lifetag_token');
  }, []);

  /** Expired or invalid JWT → API returns 401; clear stale local session so user can re-login. */
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status !== 401) return Promise.reject(error);
        const url = String(error.config?.url || '');
        if (/\/api\/login\b/.test(url) || /\/api\/register\b/.test(url)) {
          return Promise.reject(error);
        }
        if (localStorage.getItem('lifetag_token')) {
          logout();
          window.location.assign('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [logout]);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('lifetag_user', JSON.stringify(userData));
    localStorage.setItem('lifetag_token', jwt);
  };

  const updateUserInfo = (newData) => {
    setUser(prev => {
        const updated = { ...prev, ...newData };
        localStorage.setItem('lifetag_user', JSON.stringify(updated));
        return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUserInfo, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
