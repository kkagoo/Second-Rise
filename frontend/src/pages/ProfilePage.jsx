import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { ProfileIllustration } from '../components/ui/Illustrations';
import { Capacitor } from '@capacitor/core';
import HealthConnect from '../plugins/HealthConnect';
import HealthKit from '../plugins/HealthKit';
import GoalSelector, { GOAL_MAP } from '../components/GoalSelector';

async function downloadCSV(path, filename) {
  try {
    const res = await client.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch { alert('Export failed. Please try again.'); }
}

async function openOAuth(url) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch (_) {
    try {
      window.location.href = url;
    } catch (__) {
      // Silently fail — work profile message shown below
    }
  }
}

function WorkProfileWarning() {
  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-relaxed">
      <p className="font-semibold mb-1">Using a work profile?</p>
      <p>
        If this button isn't opening a browser, your work profile may be blocking external apps.
        Connect your wearables on the{' '}
        <a
          href="https://second-rise-production.up.railway.app/profile"
          className="underline font-semibold"
          target="_blank"
          rel="noreferrer"
        >
          web app
        </a>{' '}
        instead.
      </p>
    </div>
  );
}

/* ── GoalSection ──────────────────────────────────────────── */
function GoalSection({ profile, onOpen }) {
  const goal = profile?.goal;
  const meta = goal ? GOAL_MAP[goal] : null;
  const daysIn = profile?.goal_set_at
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.goal_set_at)) / 86400000))
    : null;

  const trainWhat = (() => {
    if (goal !== 'train_for') return null;
    try {
      const d = typeof profile.goal_details === 'string'
        ? JSON.parse(profile.goal_details)
        : profile.goal_details;
      return d?.what || null;
    } catch { return null; }
  })();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #EFF8FF 0%, #e0f0ff 100%)',
      borderRadius: 24,
      border: '2px solid #4BA3E3',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(75,163,227,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#4BA3E3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Your Movement Goal
          </p>
          {meta ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                  {goal === 'train_for' && trainWhat ? `Training for: ${trainWhat}` : meta.label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: daysIn !== null ? 8 : 0 }}>
                {meta.tagline}
              </p>
              {daysIn !== null && (
                <p style={{ fontSize: 12, color: '#4BA3E3', fontWeight: 600 }}>
                  Day {daysIn + 1} of your goal
                  {daysIn < 14 && ' · keep going 💪'}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#9ca3af' }}>No goal set yet</p>
          )}
        </div>
        <button
          onClick={onOpen}
          style={{
            fontSize: 13, fontWeight: 600, color: '#4BA3E3',
            background: '#EFF8FF', border: 'none',
            borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
            flexShrink: 0, marginLeft: 12,
          }}
        >
          {meta ? 'Change' : 'Set goal'}
        </button>
      </div>
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────── */
function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
      <div>
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange, multi = false }) {
  function toggle(v) {
    if (multi) {
      const arr = value || [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(value === v ? null : v);
    }
  }
  const isSelected = (v) => multi ? (value || []).includes(v) : value === v;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ label, value: v }) => (
        <button
          key={v}
          type="button"
          onClick={() => toggle(v)}
          className={`rounded-2xl px-4 py-2.5 text-sm font-semibold border-2 tap-target transition-all duration-150 ${
            isSelected(v)
              ? 'bg-blue-400 border-blue-400 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── option data ──────────────────────────────────────────── */
const AGE_RANGES = [
  { label: '40–44', value: '40-44' },
  { label: '45–49', value: '45-49' },
  { label: '50–54', value: '50-54' },
  { label: '55–60', value: '55-60' },
  { label: '61–65', value: '61-65' },
  { label: '65+',   value: '65+' },
];

const MENO_STAGES = [
  { label: 'Perimenopause',        value: 'perimenopause' },
  { label: 'Early menopause',      value: 'early_menopause' },
  { label: 'Postmenopause',        value: 'postmenopause' },
  { label: 'Surgical menopause',   value: 'surgical_menopause' },
  { label: 'Not sure',             value: 'not_sure' },
  { label: 'Not applicable',       value: 'not_applicable' },
];

const HRT_OPTIONS = [
  { label: 'Systemic HRT',       value: 'systemic' },
  { label: 'Local only',         value: 'local' },
  { label: 'None',               value: 'none' },
  { label: 'Prefer not to say',  value: 'prefer_not_to_say' },
];

const BONE_HEALTH = [
  { label: 'Normal',      value: 'normal' },
  { label: 'Osteopenia',  value: 'osteopenia' },
  { label: 'Osteoporosis',value: 'osteoporosis' },
  { label: 'Unknown',     value: 'unknown' },
];

const ACTIVITY = [
  { label: 'Sedentary',  value: 'sedentary' },
  { label: 'Light',      value: 'light' },
  { label: 'Moderate',   value: 'moderate' },
  { label: 'Active',     value: 'active' },
];

const EQUIPMENT = [
  { label: 'Dumbbells',          value: 'dumbbells' },
  { label: 'Resistance bands',   value: 'bands' },
  { label: 'Bodyweight only',    value: 'bodyweight' },
];

const JOINTS = [
  { label: 'Knees',      value: 'knees' },
  { label: 'Hips',       value: 'hips' },
  { label: 'Shoulders',  value: 'shoulders' },
  { label: 'Wrists',     value: 'wrists' },
  { label: 'Ankles',     value: 'ankles' },
  { label: 'Low back',   value: 'low back' },
  { label: 'Upper back', value: 'upper back' },
  { label: 'Neck',       value: 'neck' },
];

/* ── page ─────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  // Goal state
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [pendingGoal, setPendingGoal]     = useState(null);   // { goal, goal_details, goal_target_date }
  const [goalSaving, setGoalSaving]       = useState(false);

  // Oura state
  const [ouraStatus, setOuraStatus]     = useState(null); // null | 'connected' | 'connecting' | 'error' | 'denied'
  const [ouraLastSync, setOuraLastSync] = useState(null);
  const [ouraError, setOuraError]       = useState('');

  // Whoop state
  const [whoopStatus, setWhoopStatus]     = useState(null); // null | 'connected' | 'connecting' | 'error' | 'denied'
  const [whoopLastSync, setWhoopLastSync] = useState(null);
  const [whoopError, setWhoopError]       = useState('');

  // Apple Health state
  const [appleFile, setAppleFile]         = useState(null);
  const [appleUploading, setAppleUploading] = useState(false);
  const [appleDays, setAppleDays]         = useState(null);
  const [appleError, setAppleError]       = useState('');

  // Google Fit state
  const [googleFitStatus, setGoogleFitStatus] = useState(null);
  const [googleFitLastSync, setGoogleFitLastSync] = useState(null);
  const [googleFitError, setGoogleFitError] = useState('');

  // Fitbit state
  const [fitbitStatus, setFitbitStatus] = useState(null);
  const [fitbitLastSync, setFitbitLastSync] = useState(null);
  const [fitbitError, setFitbitError] = useState('');

  // Withings state
  const [withingsStatus, setWithingsStatus] = useState(null);
  const [withingsLastSync, setWithingsLastSync] = useState(null);
  const [withingsError, setWithingsError] = useState('');

  // Garmin state
  const [garminStatus, setGarminStatus] = useState(null);
  const [garminLastSync, setGarminLastSync] = useState(null);
  const [garminError, setGarminError] = useState('');

  // Health Connect state (Android only)
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isIOS     = Capacitor.getPlatform() === 'ios';
  const [hcStatus, setHcStatus] = useState(null); // Android Health Connect
  const [hcLastSync, setHcLastSync] = useState(null);
  const [hcError, setHcError] = useState('');
  const [hkStatus, setHkStatus] = useState(null); // iOS HealthKit
  const [hkLastSync, setHkLastSync] = useState(null);
  const [hkError, setHkError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        age_range:               profile.age_range || null,
        menopause_stage:         profile.menopause_stage || null,
        cycle_tracking_consent:  !!profile.cycle_tracking_consent,
        hrt_status:              profile.hrt_status || null,
        bone_health:          profile.bone_health || null,
        pelvic_floor_history: profile.pelvic_floor_history === 1 ? true
                            : profile.pelvic_floor_history === 0 ? false
                            : null,
        chronic_joints:       Array.isArray(profile.chronic_joints) ? profile.chronic_joints : [],
        activity_baseline:    profile.activity_baseline || null,
        equipment_available:  Array.isArray(profile.equipment_available) ? profile.equipment_available : [],
      });
      // Check connection status and last sync
      client.get('/oura/status').then((r) => {
        if (r.data?.connected) {
          setOuraStatus('connected');
          client.get('/oura/today').then((t) => {
            if (t.data?.synced_at) setOuraLastSync(t.data.synced_at);
          }).catch(() => {});
        }
      }).catch(() => {});

      // Check Whoop connection status
      client.get('/whoop/status').then((r) => {
        if (r.data?.connected) {
          setWhoopStatus('connected');
          client.get('/whoop/today').then((t) => {
            if (t.data?.synced_at) setWhoopLastSync(t.data.synced_at);
          }).catch(() => {});
        }
      }).catch(() => {});

      client.get('/googlefit/status').then((r) => {
        if (r.data?.connected) {
          setGoogleFitStatus('connected');
          client.get('/googlefit/today').then((t) => {
            if (t.data?.synced_at) setGoogleFitLastSync(t.data.synced_at);
          }).catch(() => {});
        }
      }).catch(() => {});

      client.get('/fitbit/status').then((r) => {
        if (r.data?.connected) {
          setFitbitStatus('connected');
          client.get('/fitbit/today').then((t) => {
            if (t.data?.synced_at) setFitbitLastSync(t.data.synced_at);
          }).catch(() => {});
        }
      }).catch(() => {});

      client.get('/withings/status').then((r) => {
        if (r.data?.connected) {
          setWithingsStatus('connected');
          client.get('/withings/today').then((t) => {
            if (t.data?.synced_at) setWithingsLastSync(t.data.synced_at);
          }).catch(() => {});
        }
      }).catch(() => {});

      client.get('/garmin/status').then((r) => {
        if (r.data?.connected) {
          setGarminStatus('connected');
          client.get('/garmin/today').then((t) => {
            if (t.data?.synced_at) setGarminLastSync(t.data.synced_at);
          }).catch(() => {});
        }
      }).catch(() => {});

      // Handle OAuth callback result in URL params
      const params = new URLSearchParams(window.location.search);

      const withingsResult = params.get('withings');
      if (withingsResult === 'connected') {
        setWithingsStatus('connected');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (withingsResult === 'denied') {
        setWithingsStatus('denied');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (withingsResult === 'error') {
        setWithingsStatus('error');
        setWithingsError('Something went wrong during Withings authorization.');
        window.history.replaceState({}, '', window.location.pathname);
      }
      const ouraResult = params.get('oura');
      if (ouraResult === 'connected') {
        setOuraStatus('connected');
        window.history.replaceState({}, '', window.location.pathname);
        // Refresh profile so auto-filled age_range from Oura appears immediately
        refreshProfile().catch(() => {});
      } else if (ouraResult === 'denied') {
        setOuraStatus('denied');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (ouraResult === 'error') {
        setOuraStatus('error');
        setOuraError('Something went wrong during Oura authorization.');
        window.history.replaceState({}, '', window.location.pathname);
      }

      const whoopResult = params.get('whoop');
      if (whoopResult === 'connected') {
        setWhoopStatus('connected');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (whoopResult === 'denied') {
        setWhoopStatus('denied');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (whoopResult === 'error') {
        setWhoopStatus('error');
        setWhoopError('Something went wrong during Whoop authorization.');
        window.history.replaceState({}, '', window.location.pathname);
      }

      const googleFitResult = params.get('googlefit');
      if (googleFitResult === 'connected') {
        setGoogleFitStatus('connected');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (googleFitResult === 'denied') {
        setGoogleFitStatus('denied');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (googleFitResult === 'error') {
        setGoogleFitStatus('error');
        setGoogleFitError('Something went wrong during Google Fit authorization.');
        window.history.replaceState({}, '', window.location.pathname);
      }

      const fitbitResult = params.get('fitbit');
      if (fitbitResult === 'connected') {
        setFitbitStatus('connected');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (fitbitResult === 'denied') {
        setFitbitStatus('denied');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (fitbitResult === 'error') {
        setFitbitStatus('error');
        setFitbitError('Something went wrong during Fitbit authorization.');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [profile]);

  // Auto-trigger connect when routed here from onboarding with ?autoconnect=X
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoconnect = params.get('autoconnect');
    if (!autoconnect) return;
    window.history.replaceState({}, '', window.location.pathname);
    // Small delay so the component is fully mounted before opening a browser
    const t = setTimeout(() => {
      if (autoconnect === 'oura')              handleOuraConnect();
      else if (autoconnect === 'whoop')        handleWhoopConnect();
      else if (autoconnect === 'google_fit')   handleGoogleFitConnect();
      else if (autoconnect === 'withings')     handleWithingsConnect();
      else if (autoconnect === 'garmin')       handleGarminConnect();
      else if (autoconnect === 'apple_health') handleHealthKitSync();
    }, 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh wearable statuses when app resumes from OAuth browser
  useEffect(() => {
    function refreshStatuses() {
      client.get('/oura/status').then((r) => { if (r.data?.connected) setOuraStatus('connected'); }).catch(() => {});
      client.get('/whoop/status').then((r) => { if (r.data?.connected) setWhoopStatus('connected'); }).catch(() => {});
      client.get('/googlefit/status').then((r) => { if (r.data?.connected) setGoogleFitStatus('connected'); }).catch(() => {});
      client.get('/fitbit/status').then((r) => { if (r.data?.connected) setFitbitStatus('connected'); }).catch(() => {});
      client.get('/withings/status').then((r) => { if (r.data?.connected) setWithingsStatus('connected'); }).catch(() => {});
      client.get('/garmin/status').then((r) => { if (r.data?.connected) setGarminStatus('connected'); }).catch(() => {});
    }

    // visibilitychange fires when WebView regains focus (both iOS and Android)
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshStatuses(); };
    document.addEventListener('visibilitychange', onVisibility);

    // Capacitor Browser emits browserFinished when the in-app browser closes
    let browserListener = null;
    import('@capacitor/browser').then(({ Browser }) => {
      Browser.addListener('browserFinished', refreshStatuses).then((l) => { browserListener = l; });
    }).catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (browserListener) browserListener.remove();
    };
  }, []);

  async function handleOuraConnect() {
    setOuraStatus('connecting');
    setOuraError('');
    try {
      const res = await client.get('/oura/connect', { params: { returnTo: '/profile' } });
      await openOAuth(res.data.url);
      setOuraStatus(null);
    } catch (err) {
      setOuraStatus('error');
      setOuraError(err.response?.data?.error || 'Could not start Oura authorization.');
    }
  }

  async function handleOuraSync() {
    setOuraStatus('connecting');
    setOuraError('');
    try {
      const syncRes = await client.post('/oura/sync');
      setOuraStatus('connected');
      setOuraLastSync(syncRes.data?.synced_at ?? null);
    } catch (err) {
      setOuraStatus('error');
      setOuraError(err.response?.data?.error || 'Sync failed. Please try again.');
    }
  }

  async function handleWhoopConnect() {
    setWhoopStatus('connecting');
    setWhoopError('');
    try {
      const res = await client.get('/whoop/connect', { params: { returnTo: '/profile' } });
      await openOAuth(res.data.url);
      // Reset so button is usable again — visibilitychange listener will update to 'connected' on return
      setWhoopStatus(null);
    } catch (err) {
      setWhoopStatus('error');
      setWhoopError(err.response?.data?.error || 'Could not start Whoop authorization.');
    }
  }

  async function handleWhoopSync() {
    setWhoopStatus('connecting');
    setWhoopError('');
    try {
      const syncRes = await client.post('/whoop/sync');
      setWhoopStatus('connected');
      setWhoopLastSync(syncRes.data?.synced_at ?? null);
    } catch (err) {
      setWhoopStatus('error');
      setWhoopError(err.response?.data?.error || 'Sync failed. Please try again.');
    }
  }

  async function handleAppleUpload() {
    if (!appleFile) return;
    setAppleUploading(true);
    setAppleError('');
    setAppleDays(null);
    try {
      const formData = new FormData();
      formData.append('export', appleFile);
      const res = await client.post('/health/apple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAppleDays(res.data.days_imported);
      setAppleFile(null);
    } catch (err) {
      setAppleError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setAppleUploading(false);
    }
  }

  async function handleGoogleFitConnect() {
    setGoogleFitStatus('connecting');
    setGoogleFitError('');
    try {
      const res = await client.get('/googlefit/connect', { params: { returnTo: '/profile' } });
      await openOAuth(res.data.url);
      setGoogleFitStatus(null);
    } catch (err) {
      setGoogleFitStatus('error');
      setGoogleFitError(err.response?.data?.error || 'Could not start Google Fit authorization.');
    }
  }

  async function handleGoogleFitSync() {
    setGoogleFitStatus('connecting');
    setGoogleFitError('');
    try {
      const syncRes = await client.post('/googlefit/sync');
      setGoogleFitStatus('connected');
      setGoogleFitLastSync(syncRes.data?.synced_at ?? null);
    } catch (err) {
      setGoogleFitStatus('error');
      setGoogleFitError(err.response?.data?.error || 'Sync failed. Please try again.');
    }
  }

  async function handleHealthConnectSync() {
    setHcError('');
    setHcStatus('syncing');
    try {
      const avail = await HealthConnect.checkAvailability();
      if (avail.status !== 'available') {
        setHcStatus('unavailable');
        setHcError('Health Connect is not available on this device. Install the Health Connect app from the Play Store.');
        return;
      }
      // Request permissions (shows HC dialog if not already granted)
      await HealthConnect.requestHCPermissions();
      // Read today's data
      const data = await HealthConnect.syncToday();
      // Send to backend
      await client.post('/health-connect/sync', data);
      setHcStatus('synced');
      setHcLastSync(new Date().toISOString());
    } catch (err) {
      setHcStatus('error');
      setHcError(err.message?.includes('permissions_not_granted')
        ? 'Please grant Health Connect permissions and try again.'
        : err.message || 'Sync failed. Please try again.');
    }
  }

  async function handleHealthKitSync() {
    setHkError('');
    setHkStatus('syncing');
    try {
      const avail = await HealthKit.checkAvailability();
      if (!avail.available) {
        setHkStatus('unavailable');
        setHkError('Apple Health is not available on this device.');
        return;
      }
      await HealthKit.requestHKPermissions();
      const data = await HealthKit.syncToday();
      await client.post('/healthkit/sync', data);
      setHkStatus('synced');
      setHkLastSync(new Date().toISOString());
    } catch (err) {
      setHkStatus('error');
      setHkError(err.message || 'Sync failed. Please try again.');
    }
  }

  async function handleFitbitConnect() {
    setFitbitStatus('connecting');
    setFitbitError('');
    try {
      const res = await client.get('/fitbit/connect', { params: { returnTo: '/profile' } });
      await openOAuth(res.data.url);
      setFitbitStatus(null);
    } catch (err) {
      setFitbitStatus('error');
      setFitbitError(err.response?.data?.error || 'Could not start Fitbit authorization.');
    }
  }

  async function handleFitbitSync() {
    setFitbitStatus('connecting');
    setFitbitError('');
    try {
      const syncRes = await client.post('/fitbit/sync');
      setFitbitStatus('connected');
      setFitbitLastSync(syncRes.data?.synced_at ?? null);
    } catch (err) {
      setFitbitStatus('error');
      setFitbitError(err.response?.data?.error || 'Sync failed. Please try again.');
    }
  }

  async function handleWithingsConnect() {
    setWithingsStatus('connecting');
    setWithingsError('');
    try {
      const res = await client.get('/withings/connect', { params: { returnTo: '/profile' } });
      await openOAuth(res.data.url);
      setWithingsStatus(null);
    } catch (err) {
      setWithingsStatus('error');
      setWithingsError(err.response?.data?.error || 'Could not start Withings authorization.');
    }
  }

  async function handleWithingsSync() {
    setWithingsStatus('connecting');
    setWithingsError('');
    try {
      const syncRes = await client.post('/withings/sync');
      setWithingsStatus('connected');
      setWithingsLastSync(syncRes.data?.synced_at ?? null);
    } catch (err) {
      setWithingsStatus('error');
      setWithingsError(err.response?.data?.error || 'Sync failed. Please try again.');
    }
  }

  async function handleGarminConnect() {
    setGarminStatus('connecting');
    setGarminError('');
    try {
      const res = await client.get('/garmin/connect');
      await openOAuth(res.data.url);
      setGarminStatus(null);
    } catch (err) {
      setGarminStatus('error');
      setGarminError(err.response?.data?.error || 'Could not start Garmin authorization.');
    }
  }

  async function handleGarminDisconnect() {
    setGarminStatus('connecting');
    setGarminError('');
    try {
      await client.delete('/garmin/disconnect');
      setGarminStatus(null);
      setGarminLastSync(null);
    } catch (err) {
      setGarminStatus('error');
      setGarminError(err.response?.data?.error || 'Disconnect failed.');
    }
  }

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await client.put('/profile', {
        ...form,
        pelvic_floor_history:   form.pelvic_floor_history,
        cycle_tracking_consent: form.cycle_tracking_consent,
      });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Account</p>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-sm text-gray-400 mt-1">All fields are optional — share what feels right.</p>
      </div>

      {/* Avatar illustration */}
      <div className="flex flex-col items-center pb-6">
        <ProfileIllustration size={100} />
        <p className="text-gray-500 text-sm font-medium mt-3">Second Rise member</p>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* Data sources — at the top so user connects first */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex flex-col gap-1">
          <h2 className="font-bold text-gray-900 text-base">Your data sources</h2>
          <p className="text-xs text-gray-400 mb-3">Connect your devices or import data to personalise recommendations</p>
          <div className="flex gap-3 flex-wrap mt-2">
            <a
              href="#oura-section"
              className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              Oura Ring
            </a>
            <a
              href="#whoop-section"
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              Whoop
            </a>
            <a
              href="#googlefit-section"
              className="flex items-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              Google Health
            </a>
            {!isAndroid && (
              <a
                href="#apple-section"
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
              >
                Apple Health
              </a>
            )}
            <a
              href="#withings-section"
              className="flex items-center bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              Withings
            </a>
          </div>
        </div>

        {/* Oura Ring */}
        <div id="oura-section">
        <Section title="Oura Ring" subtitle="Readiness, sleep score, HRV, resting HR, and body temperature — auto-fills your age">
          {ouraStatus === 'connected' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-600 font-semibold">
                  Connected{ouraLastSync ? ` — synced ${new Date(ouraLastSync).toLocaleString()}` : ''}
                </p>
              </div>
              <p className="text-xs text-gray-400">Your age has been auto-filled below from your Oura account.</p>
              <button
                type="button"
                onClick={handleOuraSync}
                disabled={ouraStatus === 'connecting'}
                className="w-full border-2 border-blue-300 text-blue-500 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-blue-50 disabled:opacity-50"
              >
                {ouraStatus === 'connecting' ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                type="button"
                onClick={handleOuraConnect}
                disabled={ouraStatus === 'connecting'}
                className="w-full bg-gray-50 text-gray-500 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Reconnect Oura
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ouraStatus === 'denied' && (
                <p className="text-xs text-amber-600">Authorization cancelled — try again when ready.</p>
              )}
              <button
                type="button"
                onClick={handleOuraConnect}
                disabled={ouraStatus === 'connecting'}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
              >
                {ouraStatus === 'connecting' ? 'Redirecting…' : 'Connect with Oura'}
              </button>
            </div>
          )}
          {ouraError && (
            <p className="text-red-500 text-xs">{ouraError}</p>
          )}
        </Section>
        </div>

        {/* Whoop */}
        <div id="whoop-section">
        <Section title="Whoop" subtitle="Recovery score, HRV, strain, SpO2, and sleep performance">
          {whoopStatus === 'connected' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-600 font-semibold">
                  Connected{whoopLastSync ? ` — synced ${new Date(whoopLastSync).toLocaleString()}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleWhoopSync}
                disabled={whoopStatus === 'connecting'}
                className="w-full border-2 border-blue-300 text-blue-500 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-blue-50 disabled:opacity-50"
              >
                {whoopStatus === 'connecting' ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                type="button"
                onClick={handleWhoopConnect}
                disabled={whoopStatus === 'connecting'}
                className="w-full bg-gray-50 text-gray-500 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Reconnect Whoop
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {whoopStatus === 'denied' && (
                <p className="text-xs text-amber-600">Authorization cancelled — try again when ready.</p>
              )}
              <button
                type="button"
                onClick={handleWhoopConnect}
                disabled={whoopStatus === 'connecting'}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
              >
                {whoopStatus === 'connecting' ? 'Redirecting…' : 'Connect with Whoop'}
              </button>
            </div>
          )}
          {whoopError && (
            <p className="text-red-500 text-xs">{whoopError}</p>
          )}
        </Section>
        </div>

        {/* Google Health (cloud sync) — hidden on Android where Health Connect is used instead */}
        {!isAndroid && (
          <div id="googlefit-section">
          <Section title="Google Health" subtitle="Syncs steps, heart rate, and sleep via Google Health — covers Pixel Watch, Fitbit, and other Android wearables">
            {googleFitStatus === 'connected' || fitbitStatus === 'connected' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-sm text-green-600 font-semibold">
                    Connected{(googleFitLastSync || fitbitLastSync) ? ` — synced ${new Date(googleFitLastSync || fitbitLastSync).toLocaleString()}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleFitSync}
                  disabled={googleFitStatus === 'connecting'}
                  className="w-full border-2 border-emerald-300 text-emerald-600 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-emerald-50 disabled:opacity-50"
                >
                  {googleFitStatus === 'connecting' ? 'Syncing…' : 'Sync now'}
                </button>
                <button
                  type="button"
                  onClick={handleGoogleFitConnect}
                  disabled={googleFitStatus === 'connecting'}
                  className="w-full bg-gray-50 text-gray-500 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  Reconnect Google Health
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {googleFitStatus === 'denied' && (
                  <p className="text-xs text-amber-600">Authorization cancelled — try again when ready.</p>
                )}
                <button
                  type="button"
                  onClick={handleGoogleFitConnect}
                  disabled={googleFitStatus === 'connecting'}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
                >
                  {googleFitStatus === 'connecting' ? 'Redirecting…' : 'Connect with Google Health'}
                </button>
              </div>
            )}
            {googleFitError && (
              <p className="text-red-500 text-xs">{googleFitError}</p>
            )}

          </Section>
          </div>
        )}

        {/* Apple Health — iOS native HealthKit */}
        {isIOS && (
          <div id="apple-section">
          <Section title="Apple Health" subtitle="Reads sleep stages, HRV, resting HR, SpO2, and steps directly from Apple Health — no manual export needed">
            {hkLastSync && (
              <p className="text-xs text-green-600">Last synced {new Date(hkLastSync).toLocaleString()}</p>
            )}
            <button
              type="button"
              onClick={handleHealthKitSync}
              disabled={hkStatus === 'syncing'}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
            >
              {hkStatus === 'syncing' ? 'Syncing…' : hkStatus === 'synced' ? 'Synced ✓' : 'Sync Apple Health'}
            </button>
            {hkError && <p className="text-red-500 text-xs">{hkError}</p>}
          </Section>
          </div>
        )}

        {/* Health Connect — Android only, standalone section */}
        {isAndroid && (
          <div id="healthconnect-section">
          <Section title="Health Connect" subtitle="Reads HRV, sleep, SpO2, and heart rate directly from your device — works with Pixel Watch, Samsung Watch, Fitbit, and any Health Connect wearable">
            {hcLastSync && (
              <p className="text-xs text-green-600 mb-3">
                Last synced {new Date(hcLastSync).toLocaleString()}
              </p>
            )}
            <button
              type="button"
              onClick={handleHealthConnectSync}
              disabled={hcStatus === 'syncing'}
              className="w-full border-2 border-emerald-300 text-emerald-600 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              {hcStatus === 'syncing' ? 'Syncing…' : hcStatus === 'synced' ? 'Synced ✓' : 'Sync Health Connect'}
            </button>
            {hcError && <p className="text-red-500 text-xs mt-2">{hcError}</p>}
          </Section>
          </div>
        )}

        {/* Apple Health file upload — web only (iOS uses native HealthKit, Android uses Health Connect) */}
        {!isIOS && !isAndroid && <div id="apple-section">
        <Section title="Apple Health" subtitle="Health app → avatar (top right) → Export All Health Data → upload the zip below">

          <input
            type="file"
            accept=".zip"
            onChange={(e) => { setAppleFile(e.target.files[0] ?? null); setAppleDays(null); setAppleError(''); }}
            className="text-sm text-gray-600"
          />
          {appleFile && (
            <button
              type="button"
              onClick={handleAppleUpload}
              disabled={appleUploading}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
            >
              {appleUploading ? 'Importing…' : 'Upload export'}
            </button>
          )}
          {appleDays !== null && (
            <p className="text-green-600 text-sm font-semibold">Imported {appleDays} days of data</p>
          )}
          {appleError && (
            <p className="text-red-500 text-xs">{appleError}</p>
          )}
        </Section>
        </div>}

        {/* Withings */}
        <div id="withings-section">
        <Section title="Withings" subtitle="Sleep, resting heart rate, and activity from ScanWatch, Sleep Analyzer, and other Withings devices">
          {withingsStatus === 'connected' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-green-600 font-semibold">
                  Connected{withingsLastSync ? ` — synced ${new Date(withingsLastSync).toLocaleString()}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleWithingsSync}
                disabled={withingsStatus === 'connecting'}
                className="w-full border-2 border-teal-300 text-teal-600 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-teal-50 disabled:opacity-50"
              >
                {withingsStatus === 'connecting' ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                type="button"
                onClick={handleWithingsConnect}
                disabled={withingsStatus === 'connecting'}
                className="w-full bg-gray-50 text-gray-500 font-semibold rounded-2xl py-3 text-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Reconnect Withings
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {withingsStatus === 'denied' && (
                <p className="text-xs text-amber-600">Authorization cancelled — try again when ready.</p>
              )}
              <button
                type="button"
                onClick={handleWithingsConnect}
                disabled={withingsStatus === 'connecting'}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
              >
                {withingsStatus === 'connecting' ? 'Redirecting…' : 'Connect with Withings'}
              </button>
            </div>
          )}
          {withingsError && (
            <p className="text-red-500 text-xs">{withingsError}</p>
          )}
        </Section>
        </div>

        {/* ── Goal section ──────────────────────────────────────── */}
        <GoalSection
          profile={profile}
          onOpen={() => {
            setPendingGoal({
              goal:             profile?.goal || null,
              goal_details:     profile?.goal_details || {},
              goal_target_date: profile?.goal_target_date || '',
            });
            setGoalModalOpen(true);
          }}
        />

        {/* Goal change modal */}
        {goalModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end',
          }}>
            <div style={{
              width: '100%', background: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              maxHeight: '88vh', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>Change your goal</h2>
                <button
                  onClick={() => setGoalModalOpen(false)}
                  style={{ fontSize: 22, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* 2-week nudge */}
              {profile?.goal && profile?.goal_set_at && (() => {
                const days = Math.floor((Date.now() - new Date(profile.goal_set_at)) / 86400000);
                if (days < 14) return (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 12, padding: '10px 14px',
                    fontSize: 13, color: '#92400e', marginBottom: 16, lineHeight: 1.5,
                  }}>
                    💛 You've been on this goal for {days === 0 ? 'less than a day' : `${days} day${days !== 1 ? 's' : ''}`}. Results come with consistency — we recommend staying with a goal for at least 2 weeks, ideally 8.
                  </div>
                );
                return null;
              })()}

              <GoalSelector
                value={pendingGoal?.goal}
                goalDetails={pendingGoal?.goal_details}
                goalTargetDate={pendingGoal?.goal_target_date}
                onChange={(goalId, goalDetails, goalTargetDate) => {
                  setPendingGoal({ goal: goalId, goal_details: goalDetails, goal_target_date: goalTargetDate });
                }}
              />

              <button
                disabled={!pendingGoal?.goal || goalSaving || (pendingGoal?.goal === 'train_for' && !pendingGoal?.goal_details?.what?.trim())}
                onClick={async () => {
                  if (!pendingGoal?.goal) return;
                  setGoalSaving(true);
                  try {
                    await client.put('/profile', {
                      goal:             pendingGoal.goal,
                      goal_details:     pendingGoal.goal_details,
                      goal_target_date: pendingGoal.goal_target_date,
                    });
                    await refreshProfile();
                    setGoalModalOpen(false);
                  } catch {
                    // keep modal open
                  } finally {
                    setGoalSaving(false);
                  }
                }}
                style={{
                  width: '100%', marginTop: 20,
                  background: (!pendingGoal?.goal || goalSaving) ? '#93c5fd' : '#4BA3E3',
                  color: '#fff', fontWeight: 700, fontSize: 16,
                  borderRadius: 16, padding: '16px', border: 'none',
                  opacity: (!pendingGoal?.goal || goalSaving) ? 0.6 : 1,
                  cursor: 'pointer',
                }}
              >
                {goalSaving ? 'Saving…' : 'Save goal'}
              </button>
            </div>
          </div>
        )}

        {/* Age range */}
        <Section
          title="Age range"
          subtitle={ouraStatus === 'connected' ? 'Auto-filled from Oura — adjust if needed' : 'Helps us calibrate intensity over time'}
        >
          {ouraStatus === 'connected' && (
            <span className="self-start text-[10px] font-bold uppercase tracking-wide text-blue-400 bg-blue-50 rounded-full px-2.5 py-0.5">From Oura</span>
          )}
          <Chips
            options={AGE_RANGES}
            value={form.age_range}
            onChange={(v) => set('age_range', v)}
          />
        </Section>

        {/* Menopause stage */}
        <Section title="Where are you in your journey?" subtitle="Used to personalise session types and intensity">
          <Chips
            options={MENO_STAGES}
            value={form.menopause_stage}
            onChange={(v) => set('menopause_stage', v)}
          />
        </Section>

        {/* HRT */}
        <Section title="HRT / hormone therapy" subtitle="Affects recovery time and intensity recommendations">
          <Chips
            options={HRT_OPTIONS}
            value={form.hrt_status}
            onChange={(v) => set('hrt_status', v)}
          />
        </Section>

        {/* Bone health */}
        <Section title="Bone health" subtitle="Avoids high-impact exercises if needed">
          <Chips
            options={BONE_HEALTH}
            value={form.bone_health}
            onChange={(v) => set('bone_health', v)}
          />
        </Section>

        {/* Pelvic floor */}
        <Section title="Pelvic floor history" subtitle="We'll avoid breath-holding and high-intra-abdominal-pressure moves">
          <div className="flex gap-3">
            {[{ label: 'Yes, I have a history', value: true }, { label: 'No', value: false }].map(({ label, value: v }) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => set('pelvic_floor_history', v)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold border-2 tap-target transition-all duration-150 ${
                  form.pelvic_floor_history === v
                    ? 'bg-blue-400 border-blue-400 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Cycle tracking consent */}
        {['perimenopause', 'not_sure'].includes(form.menopause_stage) && (
          <Section
            title="Cycle phase tracking"
            subtitle="When enabled, your daily check-in will ask whether you're menstruating. This helps us soften intensity on harder days."
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Include cycle question in check-in</p>
                <p className="text-xs text-gray-400 mt-0.5">Your cycle data is never shared or sold.</p>
              </div>
              <button
                type="button"
                onClick={() => set('cycle_tracking_consent', !form.cycle_tracking_consent)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
                  form.cycle_tracking_consent ? 'bg-rose-400' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.cycle_tracking_consent ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </Section>
        )}

        {/* Chronic joints */}
        <Section title="Any ongoing joint issues?" subtitle="Select all that apply — we'll work around them">
          <Chips
            options={JOINTS}
            value={form.chronic_joints}
            onChange={(v) => set('chronic_joints', v)}
            multi
          />
          {form.chronic_joints?.length > 0 && (
            <button
              type="button"
              onClick={() => set('chronic_joints', [])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-left"
            >
              Clear selection
            </button>
          )}
        </Section>

        {/* Activity baseline */}
        <Section title="How active are you usually?" subtitle="Sets the starting intensity for your sessions">
          <Chips
            options={ACTIVITY}
            value={form.activity_baseline}
            onChange={(v) => set('activity_baseline', v)}
          />
        </Section>

        {/* Equipment */}
        <Section title="Equipment you have access to" subtitle="We'll only recommend movement that fits your equipment, body, and current needs.">
          <Chips
            options={EQUIPMENT}
            value={form.equipment_available}
            onChange={(v) => set('equipment_available', v)}
            multi
          />
        </Section>

        {/* Save */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-2xl py-4 transition-colors disabled:opacity-50 tap-target text-base"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
        </button>

        {/* Download your data */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-0.5">Download your data</p>
          <p className="text-xs text-gray-400 mb-3">Your data belongs to you. Export anytime.</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => downloadCSV('/export/checkins.csv', 'checkin-history.csv')}
              className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 tap-target font-medium"
            >
              📋 Check-in history (.csv)
            </button>
            <button
              onClick={() => downloadCSV('/history/export.csv', 'session-history.csv')}
              className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 tap-target font-medium"
            >
              💪 Session history (.csv)
            </button>
            <button
              onClick={() => downloadCSV('/activity/export.csv', 'activity-log.csv')}
              className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 tap-target font-medium"
            >
              🏃 Activity log (.csv)
            </button>
            <button
              onClick={() => downloadCSV('/export/all.csv', 'second-rise-all-data.csv')}
              className="w-full text-left text-sm font-semibold text-blue-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 tap-target"
            >
              ⬇️ Download everything (.csv)
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <button onClick={() => navigate('/privacy')} className="underline underline-offset-2 hover:text-gray-600 tap-target">Privacy Policy</button>
          <span>·</span>
          <button onClick={() => navigate('/terms')} className="underline underline-offset-2 hover:text-gray-600 tap-target">Terms of Service</button>
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 tap-target transition-colors border border-gray-200 rounded-2xl py-3.5"
        >
          Sign out
        </button>

        <button
          onClick={() => navigate('/delete-account')}
          className="w-full text-sm font-semibold text-red-400 hover:text-red-600 tap-target transition-colors py-2"
        >
          Delete account
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
