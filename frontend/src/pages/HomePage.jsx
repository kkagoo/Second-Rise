import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { StrengthIllustration, RunIllustration } from '../components/ui/Illustrations';

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
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get('/checkin/today')
      .then((res) => setTodayCheckin(res.data))
      .catch(() => setTodayCheckin(null));
  }, []);

  const loading = todayCheckin === undefined;

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Welcome back</p>
            <h1 className="text-2xl font-bold text-gray-900">Second Rise</h1>
          </div>
          {/* Avatar placeholder */}
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center tap-target"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            </svg>
          </button>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mt-3 mb-4">
          Find your workout
        </h2>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workouts…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">
        {/* Today's activity card */}
        <div className="bg-sky-card rounded-3xl p-5">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : todayCheckin ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">
                    Today's activity
                  </p>
                  <p className="text-gray-700 text-sm font-medium">Check-in complete</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm">
                  <span className="text-2xl font-bold text-gray-900">{todayCheckin.computed_readiness}</span>
                  <span className="text-xs text-gray-400 font-medium">readiness</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/recommend')}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3.5 transition-colors text-sm"
              >
                View my workout →
              </button>
              <button
                onClick={() => navigate('/checkin')}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2 tap-target transition-colors"
              >
                Redo check-in
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">
                    Today's activity
                  </p>
                  <p className="text-gray-700 text-sm font-medium">Ready when you are</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  {/* Sneaker icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 18h20v2H2z"/><path d="M4 18l2-8h8l4 5 2 3"/><path d="M12 10l2 4"/>
                  </svg>
                </div>
              </div>
              <div className="flex justify-center mb-3">
                <StrengthIllustration size={72} />
              </div>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                A quick check-in helps us build a session around how you feel today.
              </p>
              <button
                onClick={() => navigate('/checkin')}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-3.5 transition-colors text-sm"
              >
                Begin check-in →
              </button>
            </div>
          )}
        </div>

        {/* Category pills */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Browse by type</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {CATEGORIES.map(({ label, type, color, text }) => (
              <button
                key={label}
                onClick={() => navigate('/videos', { state: { type } })}
                className={`flex-shrink-0 ${color} ${text} text-sm font-semibold rounded-2xl px-5 py-2.5 tap-target transition-opacity hover:opacity-80`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent sessions teaser */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Recent sessions</p>
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
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex-shrink-0 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">Your workout history</p>
              <p className="text-xs text-gray-400 mt-0.5">Track progress over time</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Sign out — low prominence */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-center text-xs text-gray-300 hover:text-gray-500 tap-target transition-colors mt-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
