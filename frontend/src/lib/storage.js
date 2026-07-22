/**
 * storage.js — persistent key-value storage for Second Rise
 *
 * On native (iOS / Android): uses @capacitor/preferences, which writes to
 * NSUserDefaults (iOS) / SharedPreferences (Android). These survive memory
 * pressure, app updates, and WebKit cache wipes that can clear localStorage.
 *
 * On web: falls back to localStorage directly.
 *
 * Pattern: always keep localStorage in sync so reads are synchronous on first
 * render (avoiding a blank flash), then confirm/correct from native storage
 * asynchronously on mount.
 */

import { Capacitor } from '@capacitor/core';

async function getPreferences() {
  const { Preferences } = await import('@capacitor/preferences');
  return Preferences;
}

export const storage = {
  async get(key) {
    if (Capacitor.isNativePlatform()) {
      try {
        const Prefs = await getPreferences();
        const { value } = await Prefs.get({ key });
        return value; // null if not set
      } catch {
        // fall through to localStorage
      }
    }
    return localStorage.getItem(key);
  },

  async set(key, value) {
    if (Capacitor.isNativePlatform()) {
      try {
        const Prefs = await getPreferences();
        await Prefs.set({ key, value: String(value) });
      } catch {
        // fall through
      }
    }
    // Always mirror to localStorage for synchronous reads
    try { localStorage.setItem(key, value); } catch {}
  },

  async remove(key) {
    if (Capacitor.isNativePlatform()) {
      try {
        const Prefs = await getPreferences();
        await Prefs.remove({ key });
      } catch {
        // fall through
      }
    }
    try { localStorage.removeItem(key); } catch {}
  },
};
