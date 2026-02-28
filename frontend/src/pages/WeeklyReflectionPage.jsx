import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Button from '../components/ui/Button';

function getMondayISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

const ENERGY_TRENDS = [
  { value: 'better', label: 'Better than last week 📈' },
  { value: 'same',   label: 'About the same 📊' },
  { value: 'worse',  label: 'Harder this week 📉' },
];

export default function WeeklyReflectionPage() {
  const [sessionsCompleted, setSessionsCompleted] = useState('');
  const [energyTrend, setEnergyTrend]             = useState(null);
  const [freeText, setFreeText]                   = useState('');
  const [submitting, setSubmitting]               = useState(false);
  const [error, setError]                         = useState('');
  const navigate = useNavigate();

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await client.post('/reflection', {
        week_of:            getMondayISO(),
        sessions_completed: sessionsCompleted ? parseInt(sessionsCompleted, 10) : undefined,
        energy_trend:       energyTrend,
        free_text_feedback: freeText || undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save reflection.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
            Weekly reflection
          </p>
          <h1 className="text-2xl font-bold text-earth-900">How was your week?</h1>
        </div>

        <div>
          <p className="text-sm font-semibold text-earth-700 mb-2">Sessions completed this week</p>
          <input
            type="number"
            min="0"
            max="14"
            value={sessionsCompleted}
            onChange={(e) => setSessionsCompleted(e.target.value)}
            className="w-full rounded-2xl border-2 border-earth-100 bg-white px-4 py-3 text-earth-900 focus:outline-none focus:border-sunrise-500 transition-colors"
            placeholder="e.g. 3"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-earth-700 mb-3">How did your energy feel overall?</p>
          <div className="flex flex-col gap-2">
            {ENERGY_TRENDS.map((t) => (
              <button
                key={t.value}
                onClick={() => setEnergyTrend(t.value)}
                className={`rounded-2xl px-4 py-4 text-sm font-semibold border-2 text-left tap-target transition-all duration-150 ${
                  energyTrend === t.value
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600 hover:border-sunrise-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-earth-700 mb-2">Anything you want to remember? (optional)</p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border-2 border-earth-100 bg-white px-4 py-3 text-earth-900 text-sm focus:outline-none focus:border-sunrise-500 transition-colors resize-none"
            placeholder="Wins, challenges, things to try differently…"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? 'Saving…' : 'Save reflection'}
        </Button>

        <button onClick={() => navigate('/')} className="text-center text-sm text-earth-400 underline tap-target">
          Skip
        </button>
      </div>
    </div>
  );
}
