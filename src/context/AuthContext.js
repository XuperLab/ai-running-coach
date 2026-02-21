// src/context/AuthContext.js
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    console.log('[Auth] login called with:', username, password ? '***' : 'empty');
    // Hardcoded credentials
    if (username === 'user' && password === 'password') {
      console.log('[Auth] Login successful, setting user');
      setUser({ username: 'user', name: 'Runner' });
      return true;
    }
    console.log('[Auth] Login failed - invalid credentials');
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
