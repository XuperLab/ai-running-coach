// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { saveData, getData } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we've checked storage

  // Restore session from AsyncStorage on app launch (SPEC: persist in LocalStorage)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await getData(STORAGE_KEYS.USER);
        if (active && stored) {
          setUser(stored);
        }
      } catch (e) {
        console.error('[Auth] failed to load session:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (username, password) => {
    console.log('[Auth] login called with:', username, password ? '***' : 'empty');
    // Hardcoded credentials (MVP)
    if (username === 'user' && password === 'password') {
      console.log('[Auth] Login successful, setting user');
      const newUser = { username: 'user', name: 'Runner' };
      setUser(newUser);
      await saveData(STORAGE_KEYS.USER, newUser);
      return true;
    }
    console.log('[Auth] Login failed - invalid credentials');
    return false;
  };

  const logout = async () => {
    setUser(null);
    try {
      await saveData(STORAGE_KEYS.USER, null);
    } catch (e) {
      console.error('[Auth] failed to clear session:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
