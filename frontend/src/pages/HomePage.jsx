import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function HomePage() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [todayCheckin, setTodayCheckin] = useState(undefined); // undefined = loading

  useEffect(() => {
    client.get('/checkin/today')
      .then((res) => setTodayCheckin(res.data))
      .catch(() => setTodayCheckin(null));
  }, []);

  const loading = todayCheckin === undefined;

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-earth-900">Second Rise</h1>
            <p className="text-sm text-earth-400">Movement built for where you are now.</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-sunrise-100 flex items-center justify-center text-sunrise-700 font-bold text-sm tap-target"
          >
            P
          </button>
        </div>

        {/* Main CTA */}
        <Card className="bg-gradient-to-br from-sunrise-50 to-white border-sunrise-100">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-3 border-sunrise-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todayCheckin ? (
            <div>
              <p className="text-xs font-semibold text-sunrise-600 uppercase tracking-widest mb-2">
                Today's check-in done ✓
              </p>
              <p className="text-earth-600 text-sm mb-4">
                Readiness score: <strong>{todayCheckin.computed_readiness}</strong>
              </p>
              <Button onClick={() => navigate('/recommend')} className="w-full">
                View my workout →
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-sunrise-600 uppercase tracking-widest mb-2">
                Ready when you are
              </p>
              <h2 className="text-xl font-bold text-earth-900 mb-2">Start with a quick check-in</h2>
              <p className="text-earth-500 text-sm mb-5">
                Three taps and Claude builds your workout around how you feel today.
              </p>
              <Button onClick={() => navigate('/checkin')} className="w-full">
                Begin check-in →
              </Button>
            </div>
          )}
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'History',    icon: '📋', path: '/history' },
            { label: 'Reflect',    icon: '📝', path: '/reflection' },
            { label: 'Profile',    icon: '👤', path: '/profile' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 bg-white rounded-2xl py-5 border-2 border-earth-100 tap-target hover:border-sunrise-200 transition-colors duration-150"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold text-earth-600">{item.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-center text-xs text-earth-300 underline tap-target"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
