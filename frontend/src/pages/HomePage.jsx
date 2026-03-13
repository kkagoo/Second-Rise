import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { WomanWorkoutIllustration } from '../components/ui/Illustrations';

const CATEGORIES = [
  { label: 'Strength',  type: 'strength',          color: 'bg-blue-400',   text: 'text-white' },
  { label: 'Yoga',      type: 'yoga',              color: 'bg-orange-400', text: 'text-white' },
  { label: 'Pilates',   type: 'pilates',           color: 'bg-sky-card border border-blue-200', text: 'text-blue-500' },
  { label: 'Mobility',  type: 'mobility',          color: 'bg-gray-100',   text: 'text-gray-700' },
  { label: 'Cardio',    type: 'low_impact_cardio', color: 'bg-gray-100',   text: 'text-gray-700' },
];

function SourceBadge({ source }) {
  if (!source) return null;
  const labels = { oura: 'Oura', whoop: 'Whoop', apple_health: 'Apple' };
  const colors = {
    oura:  'bg-blue-100 text-blue-600',
    whoop: 'bg-gray-900 text-white',
    apple_health: 'bg-red-50 text-red-500',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 ${colors[source] || 'bg-gray-100 text-gray-500'}`}>
      {labels[source] || source}
    </span>
  );
}

export default function HomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [todayCheckin, setTodayCheckin] = useState(undefined);
  const [biometrics, setBiometrics]     = useState(null);
  const [weekStats, setWeekStats]       = useState(null);

  useEffect(() => {
    client.get('/checkin/today')
      .then((res) => setTodayCheckin(res.data))
      .catch(() => setTodayCheckin(null));
    client.get('/biometrics/today')
      .then((r) => { if (r.data?.sleep_source || r.data?.recovery_source) setBiometrics(r.data); })
      .catch(() => {});
    client.get('/history/week')
      .then((r) => setWeekStats(r.data))
      .catch(() => {});
  }, []);

  const loading = todayCheckin === undefined;
  const checkinDone = !!todayCheckin;

  const hasSleepScore    = biometrics?.sleep_score != null;
  const hasRecoveryScore = biometrics?.recovery_score != null;

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* ── Hero banner ── */}
      <div className="relative bg-sky-card overflow-hidden">
        <div className="px-6 pt-14 pb-0 relative z-10">

          {/* Welcome + weekly streak */}
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Welcome back
            </p>
            {weekStats != null && (
              <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                <span className="text-base leading-none">🏆</span>
                <span className="text-xs font-bold text-gray-800">
                  {weekStats.days_worked}
                </span>
                <span className="text-xs text-gray-400">this week</span>
              </div>
            )}
          </div>

          {/* Date */}
          <p className="text-sm font-medium text-gray-400 mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {/* Biometric stats next to date */}
          {biometrics && (hasSleepScore || hasRecoveryScore) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {hasSleepScore && (
                <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                  <span className="text-xs text-gray-500">Sleep</span>
                  <span className="text-xs font-bold text-gray-900">{biometrics.sleep_score}</span>
                  <SourceBadge source={biometrics.sleep_source} />
                </div>
              )}
              {hasRecoveryScore && (
                <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                  <span className="text-xs text-gray-500">Recovery</span>
                  <span className="text-xs font-bold text-gray-900">{biometrics.recovery_score}</span>
                  <SourceBadge source={biometrics.recovery_source} />
                </div>
              )}
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 leading-tight max-w-[55%]">
            {checkinDone
              ? 'Your workout\nis ready'
              : 'Ready to\nmove today?'}
          </h1>

          <button
            onClick={() => navigate(checkinDone ? '/recommend' : '/checkin')}
            className="mt-4 mb-6 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-2xl px-6 py-3 transition-colors text-sm shadow-sm"
          >
            {checkinDone ? 'View workout →' : 'Start check-in →'}
          </button>
        </div>

        {/* Illustration — absolute positioned to the right */}
        <div className="absolute right-0 bottom-0 pointer-events-none" style={{ width: 180 }}>
          <WomanWorkoutIllustration size={180} />
        </div>

        {/* Spacer so the card has enough height for the illustration */}
        <div style={{ height: 200 }} />
      </div>

      <div className="px-5 flex flex-col gap-5 mt-5">

        {/* Today's check-in status card */}
        {!loading && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            {checkinDone ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-0.5">
                    Today's check-in
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {todayCheckin.computed_readiness}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">readiness score</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs bg-blue-50 text-blue-500 font-semibold rounded-full px-3 py-1">
                    Done ✓
                  </span>
                  <button
                    onClick={() => navigate('/checkin')}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Redo check-in
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Today's check-in
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">Not done yet</p>
                </div>
                <button
                  onClick={() => navigate('/checkin')}
                  className="bg-blue-400 hover:bg-blue-500 text-white text-xs font-bold rounded-xl px-4 py-2 transition-colors tap-target"
                >
                  Begin →
                </button>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex justify-center">
            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Biometrics detail card */}
        {biometrics && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Today's data</p>

            {/* Source-attributed insight lines */}
            <div className="flex flex-col gap-2 mb-3">
              {hasSleepScore && (
                <p className="text-sm text-gray-700">
                  From <span className="font-semibold">{biometrics.sleep_source === 'oura' ? 'Oura' : biometrics.sleep_source === 'whoop' ? 'Whoop' : 'Apple Health'}</span> your sleep score is{' '}
                  <span className="font-bold text-gray-900">{biometrics.sleep_score}</span>
                  {biometrics.total_sleep_min != null && (
                    <span className="text-gray-400"> ({Math.floor(biometrics.total_sleep_min / 60)}h {biometrics.total_sleep_min % 60}m)</span>
                  )}
                </p>
              )}
              {hasRecoveryScore && (
                <p className="text-sm text-gray-700">
                  From <span className="font-semibold">{biometrics.recovery_source === 'whoop' ? 'Whoop' : 'Oura'}</span> your recovery is{' '}
                  <span className="font-bold text-gray-900">{biometrics.recovery_score}</span>
                </p>
              )}
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-2 gap-3">
              {biometrics.hrv_balance != null && (
                <div>
                  <p className="text-xl font-bold text-gray-900">{biometrics.hrv_balance}</p>
                  <p className="text-xs text-gray-400">HRV balance</p>
                </div>
              )}
              {biometrics.hrv_rmssd_ms != null && (
                <div>
                  <p className="text-xl font-bold text-gray-900">{Math.round(biometrics.hrv_rmssd_ms)}</p>
                  <p className="text-xs text-gray-400">HRV rMSSD ms</p>
                </div>
              )}
              {biometrics.resting_hr != null && (
                <div>
                  <p className="text-xl font-bold text-gray-900">{biometrics.resting_hr}</p>
                  <p className="text-xs text-gray-400">resting bpm</p>
                </div>
              )}
              {biometrics.strain_score != null && (
                <div>
                  <p className="text-xl font-bold text-gray-900">{biometrics.strain_score?.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">strain</p>
                </div>
              )}
            </div>

            {biometrics.temp_flag && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 font-medium">
                Temp elevated — possible hot flash signal today
              </div>
            )}
          </div>
        )}

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

        {/* History teaser */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Completed workouts</p>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-blue-400 font-semibold tap-target"
            >
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

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-center text-xs text-gray-300 hover:text-gray-500 tap-target transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
