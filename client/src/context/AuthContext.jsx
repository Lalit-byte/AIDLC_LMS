import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { AuthContext } from './authContextBase';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  const performLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }, []);

  // Validate existing token on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const freshUser = await api.getCurrentUser(storedToken);
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            performLogout();
          }
        } catch {
          performLogout();
        }
      }
      setLoading(false);
    }

    initAuth();
  }, [performLogout]);

  const login = async (email, password) => {
    const result = await api.login({ email, password });
    if (result && result.token) {
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  };

  const register = async ({ name, email, password, role }) => {
    const result = await api.register({ name, email, password, role });
    if (result && result.token) {
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout: performLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
