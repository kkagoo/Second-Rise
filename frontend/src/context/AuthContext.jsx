import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { storage } from '../lib/storage';

const AuthContext = createContext(null);

const TOKEN_KEY        = 'sr_token';
const PROFILE_CACHE_KEY = 'sr_profile_cache';

function loadCachedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  // Seed synchronously from localStorage for instant render (avoids flash).
  // On native, the real source of truth is @capacitor/preferences — we reconcile
  // that asynchronously in the mount effect below.
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [profile, setProfile] = useState(() => loadCachedProfile());
  const [loading, setLoading] = useState(true);

  // On mount: read from native Preferences (survives iOS WebKit cache wipes).
  // If Preferences has a token that localStorage lost, we recover silently.
  useEffect(() => {
    storage.get(TOKEN_KEY).then((nativeToken) => {
      const resolved = nativeToken ?? localStorage.getItem(TOKEN_KEY);
      if (resolved) {
        // Keep localStorage in sync with native storage
        try { localStorage.setItem(TOKEN_KEY, resolved); } catch {}
        setToken(resolved);
      } else {
        setToken(null);
        setLoading(false);
      }
    }).catch(() => {
      // If storage read fails, fall through with whatever we got from localStorage
      if (!localStorage.getItem(TOKEN_KEY)) setLoading(false);
    });
  }, []);

  // Fetch profile whenever token changes
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
      setProfile(null);
      setLoading(false);
    }
  }, [token]);

  function login(newToken) {
    // Update state synchronously — lets navigate() happen immediately
    setToken(newToken);
    // Mirror to localStorage so the synchronous seed on next boot works
    try { localStorage.setItem(TOKEN_KEY, newToken); } catch {}
    // Persist to Capacitor Preferences in background (survives iOS WebKit wipes)
    storage.set(TOKEN_KEY, newToken).catch(() => {});
  }

  async function logout() {
    await storage.remove(TOKEN_KEY);
    try { localStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
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
