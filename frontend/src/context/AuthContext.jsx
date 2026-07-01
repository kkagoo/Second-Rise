import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

const PROFILE_CACHE_KEY = 'sr_profile_cache';

function loadCachedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sr_token'));
  // Seed from cache so UI renders immediately on repeat launches
  const [profile, setProfile] = useState(() => loadCachedProfile());
  // Only show loading spinner if we have a token but NO cached profile (true first launch)
  const [loading, setLoading] = useState(!!localStorage.getItem('sr_token') && !loadCachedProfile());

  useEffect(() => {
    if (token) {
      client.get('/profile')
        .then((res) => {
          setProfile(res.data);
          try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(res.data)); } catch {}
        })
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
    localStorage.removeItem(PROFILE_CACHE_KEY);
    setToken(null);
    setProfile(null);
  }

  function refreshProfile() {
    return client.get('/profile').then((res) => {
      setProfile(res.data);
      try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(res.data)); } catch {}
    });
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
