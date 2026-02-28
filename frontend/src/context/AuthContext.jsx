import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sr_token'));
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('sr_token'));

  useEffect(() => {
    if (token) {
      client.get('/profile')
        .then((res) => setProfile(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  function login(newToken) {
    localStorage.setItem('sr_token', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('sr_token');
    setToken(null);
    setProfile(null);
  }

  function refreshProfile() {
    return client.get('/profile').then((res) => setProfile(res.data));
  }

  return (
    <AuthContext.Provider value={{ token, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
