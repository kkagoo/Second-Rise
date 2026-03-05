import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { WomanWorkoutIllustration } from '../components/ui/Illustrations';

const CATEGORIES = [
  { label: 'Strength',  type: 'strength',          color: 'bg-blue-400',   text: 'text-white' },
  { label: 'Yoga',      type: 'yoga',              color: 'bg-orange-400', text: 'text-white' },
  { label: 'Mobility',  type: 'mobility',          color: 'bg-sky-card border border-blue-200', text: 'text-blue-500' },
  { label: 'Cardio',    type: 'low_impact_cardio', color: 'bg-gray-100',   text: 'text-gray-700' },
];

export default function HomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [todayCheckin, setTodayCheckin] = useState(undefined);
  const [biometrics, setBiometrics]     = useState(null);

  useEffect(() => {
    client.get('/checkin/today')
      .then((res) => setTodayCheckin(res.data))
      .catch(() => setTodayCheckin(null));
    client.get('/biometrics/today')
      .then((r) => { if (r.data?.source) setBiometrics(r.data); })
      .catch(() => {});
  }, []);

  const loading = todayCheckin === undefined;
  const checkinDone = !!todayCheckin;

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* ── Hero banner ── */}
      <div className="relative bg-sky-card overflow-hidden">
        {/* Text */}
        <div className="px-6 pt-14 pb-0 relative z-10">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-0.5">
            Welcome back
          </p>
          <p className="text-sm font-medium text-gray-400 mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
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

        {/* Biometrics widget */}
        {biometrics && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Recovery today</p>
              <span className="text-xs bg-blue-50 text-blue-500 font-semibold rounded-full px-2.5 py-0.5">
                {biometrics.source === 'oura' ? 'Oura' : 'Apple Health'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {biometrics.readiness_score != null && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{biometrics.readiness_score}</p>
                  <p className="text-xs text-gray-400">readiness</p>
                </div>
              )}
              {biometrics.total_sleep_min != null && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor(biometrics.total_sleep_min / 60)}h{biometrics.total_sleep_min % 60}m
                  </p>
                  <p className="text-xs text-gray-400">sleep</p>
                </div>
              )}
              {biometrics.hrv_balance != null && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{biometrics.hrv_balance}</p>
                  <p className="text-xs text-gray-400">HRV balance</p>
                </div>
              )}
              {biometrics.resting_hr != null && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{biometrics.resting_hr}</p>
                  <p className="text-xs text-gray-400">resting bpm</p>
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
