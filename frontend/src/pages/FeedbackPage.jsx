import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';

const RATINGS = [
  { value: 'too_easy',     label: 'Too easy',     icon: '😴' },
  { value: 'just_right',   label: 'Just right',   icon: '✓' },
  { value: 'too_much',     label: 'Too much',     icon: '😓' },
  { value: 'didnt_finish', label: "Didn't finish", icon: '—' },
];

const FLARE_REGIONS = [
  'Knees', 'Hips', 'Low Back', 'Shoulders', 'Neck',
  'Wrists/Hands', 'Feet/Ankles', 'Upper Back', 'Core/Abdominal',
];

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rec_id } = location.state || {};

  const [rating, setRating]         = useState(null);
  const [flares, setFlares]         = useState([]);
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  function toggleFlare(region) {
    setFlares((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    setError('');
    try {
      await client.post('/feedback', {
        rec_id,
        effort_rating:    rating,
        flare_up_regions: flares,
        notes:            notes || undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-5 pt-14 pb-28">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            Post-session
          </p>
          <h1 className="text-2xl font-bold text-gray-900">How did that feel?</h1>
        </div>

        {/* Effort rating */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Overall effort</p>
          <div className="grid grid-cols-2 gap-3">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRating(r.value)}
                className={`rounded-2xl py-4 text-sm font-semibold border-2 tap-target transition-all duration-150 ${
                  rating === r.value
                    ? 'border-blue-400 bg-sky-card text-blue-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flare-ups */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Any new flare-ups?</p>
          <p className="text-xs text-gray-400 mb-3">Select all that apply (optional)</p>
          <div className="flex flex-wrap gap-2">
            {FLARE_REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => toggleFlare(region)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border-2 tap-target transition-colors duration-150 ${
                  flares.includes(region)
                    ? 'border-blue-400 bg-sky-card text-blue-600'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Anything else to note? (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
            placeholder="How did your body feel?"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed tap-target"
        >
          {submitting ? 'Saving…' : 'Save & go home'}
        </button>

        <button
          onClick={() => navigate('/')}
          className="text-center text-sm text-gray-400 hover:text-gray-600 tap-target transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
