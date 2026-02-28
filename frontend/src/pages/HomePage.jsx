import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconReflect() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function HomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [todayCheckin, setTodayCheckin] = useState(undefined);

  useEffect(() => {
    client.get('/checkin/today')
      .then((res) => setTodayCheckin(res.data))
      .catch(() => setTodayCheckin(null));
  }, []);

  const loading = todayCheckin === undefined;

  const quickLinks = [
    { label: 'History',  Icon: IconHistory,  path: '/history' },
    { label: 'Reflect',  Icon: IconReflect,  path: '/reflection' },
    { label: 'Profile',  Icon: IconProfile,  path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">Second Rise</p>
          <h1 className="text-2xl font-semibold text-stone-900 leading-tight">
            Movement built for<br />where you are now.
          </h1>
        </div>

        {/* Main CTA card */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
            </div>
          ) : todayCheckin ? (
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">
                Check-in complete
              </p>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-stone-600">
                  Readiness score
                </p>
                <span className="text-2xl font-semibold text-stone-900">{todayCheckin.computed_readiness}</span>
              </div>
              <Button onClick={() => navigate('/recommend')} className="w-full">
                View my workout
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">
                Ready when you are
              </p>
              <h2 className="text-lg font-semibold text-stone-900 mb-2">Start with a quick check-in</h2>
              <p className="text-stone-500 text-sm mb-5 leading-relaxed">
                A few questions and we'll build your session around how you feel today.
              </p>
              <Button onClick={() => navigate('/checkin')} className="w-full">
                Begin check-in
              </Button>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2">
          {quickLinks.map(({ label, Icon, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 bg-white rounded-xl py-5 border border-stone-200 tap-target hover:bg-stone-50 transition-colors duration-150"
            >
              <span className="text-stone-500"><Icon /></span>
              <span className="text-xs font-medium text-stone-600">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-center text-xs text-stone-400 hover:text-stone-600 tap-target transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
