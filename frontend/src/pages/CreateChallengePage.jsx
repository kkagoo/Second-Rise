import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const TEMPLATES = [
  { name: '5-Day 10-Minute Move Reset',     duration: 5 },
  { name: '7-Day Walk Every Day Challenge', duration: 7 },
  { name: '3-Day Stretch & Breathe Reset',  duration: 3 },
];

const DURATIONS = [3, 5, 7];

export default function CreateChallengePage() {
  const navigate = useNavigate();
  const [name, setName]         = useState('');
  const [duration, setDuration] = useState(5);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function applyTemplate(t) {
    setName(t.name);
    setDuration(t.duration);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Give your challenge a name.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/challenges', { name: name.trim(), duration_days: duration });
      navigate(`/c/${res.data.short_code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create challenge. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-12 pb-28 safe-bottom">
      <div className="w-full max-w-sm mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Start a challenge</h1>
          <p className="text-gray-400 text-sm mt-1">Invite friends to move together for a few days.</p>
        </div>

        {/* Quick templates */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick start</p>
        <div className="flex flex-col gap-2 mb-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => applyTemplate(t)}
              className={`text-left px-4 py-3 rounded-2xl border transition-colors text-sm ${
                name === t.name && duration === t.duration
                  ? 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-gray-400 ml-2">{t.duration} days</span>
            </button>
          ))}
        </div>

        {/* Custom form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
              Challenge name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 5-Day Move More"
              maxLength={60}
              className="w-full rounded-2xl bg-gray-100 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-2xl border font-semibold text-sm transition-colors ${
                    duration === d
                      ? 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 mt-1 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create & get share link'}
          </button>
        </form>

      </div>
    </div>
  );
}
