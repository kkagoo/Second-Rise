import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { WomanWorkoutIllustration } from '../components/ui/Illustrations';
import StreakShareModal from '../components/ui/StreakShareModal';

const CATEGORIES = [
  { label: 'Strength',  type: 'strength',          color: 'bg-blue-400',   text: 'text-white' },
  { label: 'Yoga',      type: 'yoga',              color: 'bg-orange-400', text: 'text-white' },
  { label: 'Pilates',   type: 'pilates',           color: 'bg-sky-card border border-blue-200', text: 'text-blue-500' },
  { label: 'Mobility',  type: 'mobility',          color: 'bg-gray-100',   text: 'text-gray-700' },
  { label: 'Cardio',    type: 'low_impact_cardio', color: 'bg-gray-100',   text: 'text-gray-700' },
];

// Inline SVG icons for stats
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2c0 0-5 4.5-5 10a5 5 0 0 0 10 0C17 6.5 12 2 12 2zm0 16a3 3 0 0 1-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 0 1-3 3z" />
    </svg>
  );
}

const SOURCE_COLORS = {
  oura:         'bg-blue-100 text-blue-600',
  whoop:        'bg-gray-900 text-white',
  google_fit:   'bg-emerald-50 text-emerald-600',
  fitbit:       'bg-emerald-50 text-emerald-600',
  apple_health: 'bg-red-50 text-red-500',
};
const SOURCE_LABELS = { oura: 'Oura', whoop: 'Whoop', google_fit: 'Google Fit', health_connect: 'Google Health', fitbit: 'Fitbit', apple_health: 'Apple', garmin: 'Garmin', withings: 'Withings' };
const WEARABLE_NAMES = {
  oura: 'Oura Ring', whoop: 'WHOOP', google_fit: 'Google Health',
  health_connect: 'Google Health', fitbit: 'Fitbit',
  apple_health: 'Apple Health', garmin: 'Garmin', withings: 'Withings',
};

// Format a sources array into "WHOOP + Apple Health" style label, deduplicating by display name
function sourceLabel(sources) {
  if (!sources?.length) return null;
  const seen = new Set();
  return sources
    .map(s => WEARABLE_NAMES[s] ?? s)
    .filter(name => { if (seen.has(name)) return false; seen.add(name); return true; })
    .join(' + ');
}

function formatSleepMin(min) {
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
}

function StatPill({ icon, label, value, source }) {
  if (value == null) return null;
  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm shrink-0">
      <span className="text-gray-500">{icon}</span>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-bold text-gray-900">{value}</span>
      {source && (
        <span className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 ${SOURCE_COLORS[source] || 'bg-gray-100 text-gray-500'}`}>
          {SOURCE_LABELS[source] || source}
        </span>
      )}
    </div>
  );
}

export default function HomePage() {
  useAuth();
  const navigate = useNavigate();
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [biometrics, setBiometrics]     = useState(null);
  const [weekStats, setWeekStats]       = useState(null);
  const [workoutReview, setWorkoutReview] = useState(null);
  const [biometricTrend, setBiometricTrend] = useState(null);
  const [streak, setStreak]                 = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    client.get('/checkin/today', { params: { localDate } })
      .then((res) => {
        setTodayCheckin(res.data);
        if (res.data?.session_done) {
          client.get('/wearable-review/today').then((r) => setWorkoutReview(r.data)).catch(() => {});
        }
      })
      .catch(() => setTodayCheckin(null));
    client.get('/biometrics/today')
      .then((r) => { if (r.data?.sources?.length || r.data?.sleep_source || r.data?.recovery_source) setBiometrics(r.data); })
      .catch(() => {});
    client.get('/google-fit/trends')
      .then((r) => { if (r.data?.patterns?.length > 0) setBiometricTrend(r.data); })
      .catch(() => {});
    client.get('/history/week')
      .then((r) => setWeekStats(r.data))
      .catch(() => {});
    client.get('/checkin/streak')
      .then((r) => {
        setStreak(r.data);
        const s = r.data?.current_streak;
        if (s > 0 && s % 7 === 0) {
          const lastShown = parseInt(localStorage.getItem('sr_last_share_streak') || '0', 10);
          if (lastShown !== s) {
            setShowShareModal(true);
            localStorage.setItem('sr_last_share_streak', String(s));
          }
        }
      })
      .catch(() => {});
  }, []);

  const checkinDone = !!todayCheckin;
  const sessionDone = !!todayCheckin?.session_done;

  // Energy suggestion label derived from recovery/sleep
  const energyScore = biometrics?.energy_suggestion;
  const energyLabel = energyScore == null ? null
    : energyScore >= 80 ? 'High energy'
    : energyScore >= 60 ? 'Moderate energy'
    : energyScore >= 35 ? 'Low energy'
    : 'Rest day';

  return (
    <div className="min-h-screen bg-white pb-28">
      {showShareModal && (
        <StreakShareModal streak={streak?.current_streak} onClose={() => setShowShareModal(false)} />
      )}

      {/* ── Hero banner ── */}
      <div className="bg-sky-card">
        <div className="relative overflow-hidden">
          {/* Profile avatar — top right, respects safe area */}
          <button
            onClick={() => navigate('/profile')}
            style={{ top: 'max(3rem, calc(env(safe-area-inset-top) + 0.75rem))' }}
            className="absolute right-4 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center tap-target"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" />
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            </svg>
          </button>

          {/* Hero text — constrained left to leave room for illustration */}
          <div
            className="px-6 pb-5 relative z-10 max-w-[62%]"
            style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}
          >
            {/* Welcome + streak badges */}
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                Welcome back
              </p>
              {streak?.current_streak > 0 && (
                <div className="flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5">
                  <span className="text-sm leading-none">🔥</span>
                  <span className="text-xs font-bold text-gray-800">{streak.current_streak}</span>
                  <span className="text-[10px] text-gray-400">{streak.current_streak === 1 ? 'day' : 'days'}</span>
                </div>
              )}
              {weekStats != null && (
                <div className="flex items-center gap-1 bg-white/70 rounded-full px-2 py-0.5">
                  <span className="text-sm leading-none">🏆</span>
                  <span className="text-xs font-bold text-gray-800">{weekStats.days_worked}</span>
                  <span className="text-[10px] text-gray-400">this wk</span>
                </div>
              )}
            </div>

            {/* Date */}
            <p className="text-sm font-medium text-gray-400 mb-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>

            {biometrics?.temp_flag && (
              <div className="mb-2 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-700 font-medium">
                🌡 Temp elevated — possible hot flash signal
              </div>
            )}

            {biometricTrend?.hasNegativePattern && (
              <div className="mb-2 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-[11px] text-blue-700 font-medium">
                📊 {biometricTrend.patterns[0].message} · today's recommendation adjusts for this
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {sessionDone ? 'Great work\ntoday 🎉' : checkinDone ? 'Your workout\nis ready' : 'Ready to\nmove today?'}
            </h1>

            {!sessionDone && (
              <button
                onClick={() => navigate(checkinDone ? '/recommend' : '/checkin')}
                className="mt-4 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-2xl px-6 py-3 transition-colors text-sm shadow-sm"
              >
                {checkinDone ? 'View workout →' : 'Start check-in →'}
              </button>
            )}
          </div>

          {/* Illustration — sits top-right */}
          <div className="absolute right-0 top-4 bottom-0 pointer-events-none flex items-end" style={{ width: 160 }}>
            <WomanWorkoutIllustration size={200} />
          </div>
        </div>

        {/* Stat pills — full width, outside overflow-hidden so scroll works on iOS */}
        {biometrics && (
          <div className="px-4 pb-4 pt-1">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              <StatPill icon={<MoonIcon />}  label="Sleep"    value={biometrics.sleep_score}    source={biometrics.sleep_source} />
              <StatPill icon={<BoltIcon />}  label="Recovery" value={biometrics.recovery_score} source={biometrics.recovery_source} />
              <StatPill icon={<PulseIcon />} label="HRV"      value={biometrics.hrv_balance ?? (biometrics.hrv_rmssd_ms != null ? Math.round(biometrics.hrv_rmssd_ms) : null)} source={null} />
              <StatPill icon={<HeartIcon />} label="HR"       value={biometrics.resting_hr}     source={null} />
              {biometrics.spo2_percentage != null && (
                <StatPill icon={<span className="text-[10px]">O₂</span>} label="SpO2" value={`${biometrics.spo2_percentage}%`} source={null} />
              )}
              {biometrics.steps != null && (
                <StatPill icon={<span className="text-[10px]">👟</span>} label="Steps" value={biometrics.steps.toLocaleString()} source={null} />
              )}
              {biometrics.strain_score != null && (
                <StatPill icon={<FlameIcon />} label="Prev. strain" value={biometrics.strain_score?.toFixed(1)} source={null} />
              )}
              {biometrics.body_battery != null && (
                <StatPill icon={<BoltIcon />} label="Battery" value={biometrics.body_battery} source={null} />
              )}
              {energyLabel && (
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm shrink-0">
                  <span className="text-xs font-semibold text-gray-700">{energyLabel}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 flex flex-col gap-5 mt-5">

        {/* Today's check-in status card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            {checkinDone ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-0.5">
                    Today's check-in
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {todayCheckin.computed_readiness > 0 ? todayCheckin.computed_readiness : '—'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">readiness score</span>
                  </div>
                  {biometrics?.sources?.length > 0 && (
                    <p className="text-xs text-blue-400 mt-1">
                      Includes your {sourceLabel(biometrics.sources)} data
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs bg-blue-50 text-blue-500 font-semibold rounded-full px-3 py-1">Done ✓</span>
                  <button onClick={() => navigate('/checkin')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Redo check-in
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Today's check-in</p>
                    {biometrics?.biometric_readiness != null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-gray-900">{biometrics.biometric_readiness}</span>
                        <span className="text-xs text-gray-400 font-medium">estimated readiness</span>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-700 mt-1">Not done yet</p>
                    )}
                    {biometrics?.biometric_readiness != null && (
                      <p className="text-xs text-gray-400 mt-0.5">Check in for a personalised score</p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/checkin')}
                    className="bg-blue-400 hover:bg-blue-500 text-white text-xs font-bold rounded-xl px-4 py-2 transition-colors tap-target"
                  >
                    Begin →
                  </button>
                </div>
                {biometrics?.sources?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-semibold text-blue-400">
                        From your {sourceLabel(biometrics.sources)}:
                      </span>
                      {biometrics.recovery_score != null && ` Recovery ${biometrics.recovery_score}`}
                      {biometrics.sleep_score != null && ` · Sleep ${biometrics.sleep_score}`}
                      {biometrics.total_sleep_min != null && ` · ${formatSleepMin(biometrics.total_sleep_min)} sleep`}
                      {(biometrics.hrv_balance != null || biometrics.hrv_rmssd_ms != null) && ` · HRV ${biometrics.hrv_balance ?? Math.round(biometrics.hrv_rmssd_ms)}`}
                      {biometrics.resting_hr != null && ` · HR ${biometrics.resting_hr}`}
                      {biometrics.strain_score != null && ` · Strain ${biometrics.strain_score?.toFixed(1)}`}
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Browse by type */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">Browse by type</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {CATEGORIES.map(({ label, type, color, text }) => (
              <button
                key={label}
                onClick={() => navigate('/videos', { state: { type } })}
                className={`flex-shrink-0 ${color} ${text} text-sm font-bold rounded-2xl px-5 py-3 tap-target transition-opacity hover:opacity-80`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Post-workout review — inline, no navigation */}
        {sessionDone && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Post-workout review</p>
            {workoutReview ? (
              <>
                {workoutReview.adherence_status !== 'unknown' && (
                  <p className="text-base font-bold text-orange-700 mb-1">
                    {workoutReview.adherence_status === 'followed' && 'On plan ✓'}
                    {workoutReview.adherence_status === 'over' && 'Went above plan'}
                    {workoutReview.adherence_status === 'under' && 'Below plan'}
                  </p>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">{workoutReview.summary}</p>
                {workoutReview.recommendation && (
                  <p className="text-sm text-gray-700 font-medium leading-relaxed mt-2">{workoutReview.recommendation}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-orange-300">Loading review…</p>
            )}
          </div>
        )}

        {/* History teaser */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Completed workouts</p>
            <button onClick={() => navigate('/history')} className="text-xs text-blue-400 font-semibold tap-target">
              See all
            </button>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="w-full flex items-center gap-4 bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 transition-colors text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex-shrink-0 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">Your workout history</p>
              <p className="text-xs text-gray-400 mt-0.5">Sessions you marked as done</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
