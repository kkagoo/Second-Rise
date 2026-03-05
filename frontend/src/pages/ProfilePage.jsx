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
  const [ouraToken, setOuraToken]         = useState('');
  const [ouraStatus, setOuraStatus]       = useState(null); // null | 'connecting' | 'connected' | 'error'
  const [ouraLastSync, setOuraLastSync]   = useState(null);
  const [ouraError, setOuraError]         = useState('');

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
      // Check if Oura already connected — fetch last sync
      if (profile.oura_access_token) {
        client.get('/oura/today').then((r) => {
          if (r.data?.synced_at) {
            setOuraStatus('connected');
            setOuraLastSync(r.data.synced_at);
          } else {
            setOuraStatus('connected');
          }
        }).catch(() => setOuraStatus('connected'));
      }
    }
  }, [profile]);

  async function handleOuraConnect() {
    if (!ouraToken.trim()) return;
    setOuraStatus('connecting');
    setOuraError('');
    try {
      await client.put('/oura/token', { token: ouraToken.trim() });
      const syncRes = await client.post('/oura/sync');
      setOuraStatus('connected');
      setOuraLastSync(syncRes.data?.synced_at ?? null);
      setOuraToken('');
    } catch (err) {
      setOuraStatus('error');
      setOuraError(err.response?.data?.error || 'Could not connect. Check your token.');
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

        {/* Age range */}
        <Section title="Age range" subtitle="Helps us calibrate intensity over time">
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

        {/* Oura Ring */}
        <Section title="Oura Ring" subtitle="Connect for daily readiness, sleep, and HRV data">
          {ouraStatus === 'connected' ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-green-600 font-semibold">
                Connected
                {ouraLastSync ? ` — last synced ${new Date(ouraLastSync).toLocaleString()}` : ''}
              </p>
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
              <p className="text-xs text-gray-400">
                Get your token at <span className="font-mono">cloud.ouraring.com → Personal Access Tokens</span>
              </p>
              <input
                type="password"
                value={ouraToken}
                onChange={(e) => setOuraToken(e.target.value)}
                placeholder="Paste your Personal Access Token"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-blue-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleOuraConnect}
                disabled={!ouraToken.trim() || ouraStatus === 'connecting'}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3 text-sm transition-colors disabled:opacity-50"
              >
                {ouraStatus === 'connecting' ? 'Connecting…' : 'Connect Oura'}
              </button>
            </div>
          )}
          {ouraError && (
            <p className="text-red-500 text-xs">{ouraError}</p>
          )}
        </Section>

        {/* Apple Health */}
        <Section title="Apple Health" subtitle="Import HRV, sleep, steps from your iPhone">
          <p className="text-xs text-gray-400">
            On iPhone: Health app → your avatar (top right) → Export All Health Data → save the zip here.
          </p>
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
