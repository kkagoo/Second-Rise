import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { ProfileIllustration } from '../components/ui/Illustrations';

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
];

const MENO_STAGES = [
  { label: 'Perimenopause',  value: 'perimenopause' },
  { label: 'Postmenopause',  value: 'postmenopause' },
  { label: 'Surgical',       value: 'surgical' },
  { label: 'Not sure',       value: 'unsure' },
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

  useEffect(() => {
    if (profile) {
      setForm({
        age_range:            profile.age_range || null,
        menopause_stage:      profile.menopause_stage || null,
        hrt_status:           profile.hrt_status || null,
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

      // Handle OAuth callback result in URL params
      const params = new URLSearchParams(window.location.search);
      const ouraResult = params.get('oura');
      if (ouraResult === 'connected') {
        setOuraStatus('connected');
        window.history.replaceState({}, '', window.location.pathname);
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
    }
  }, [profile]);

  async function handleOuraConnect() {
    setOuraStatus('connecting');
    setOuraError('');
    try {
      const res = await client.get('/oura/connect');
      window.location.href = res.data.url;
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
      const res = await client.get('/whoop/connect');
      window.location.href = res.data.url;
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
        pelvic_floor_history: form.pelvic_floor_history,
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
          <div className="flex gap-3 flex-wrap">
            <a
              href="#oura-section"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              <span>🔵</span> Oura Ring
            </a>
            <a
              href="#whoop-section"
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              <span>⚫</span> Whoop
            </a>
            <a
              href="#apple-section"
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-2xl px-4 py-2.5 transition-colors"
            >
              <span>🍎</span> Apple Health
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

        {/* Apple Health */}
        <div id="apple-section">
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
        </div>

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
        <Section title="Equipment you have access to" subtitle="Claude will only recommend exercises you can do">
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

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 tap-target transition-colors border border-gray-200 rounded-2xl py-3.5"
        >
          Sign out
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
