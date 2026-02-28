import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import Button from '../components/ui/Button';

const RATINGS = [
  { value: 'too_easy',    label: 'Too easy 😴',      color: 'blue' },
  { value: 'just_right',  label: 'Just right 👌',    color: 'green' },
  { value: 'too_much',    label: 'Too much 😓',       color: 'orange' },
  { value: 'didnt_finish',label: "Didn't finish 🛑", color: 'red' },
];

const FLARE_REGIONS = [
  'Knees', 'Hips', 'Low Back', 'Shoulders', 'Neck',
  'Wrists/Hands', 'Feet/Ankles', 'Upper Back', 'Core/Abdominal',
];

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rec_id } = location.state || {};

  const [rating, setRating]       = useState(null);
  const [flares, setFlares]       = useState([]);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

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
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
            Post-session
          </p>
          <h1 className="text-2xl font-bold text-earth-900">How did that feel?</h1>
        </div>

        {/* Effort rating */}
        <div>
          <p className="text-sm font-semibold text-earth-700 mb-3">Overall effort</p>
          <div className="grid grid-cols-2 gap-3">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRating(r.value)}
                className={`rounded-2xl py-4 text-sm font-semibold border-2 tap-target transition-all duration-150 ${
                  rating === r.value
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600 hover:border-sunrise-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flare-ups */}
        <div>
          <p className="text-sm font-semibold text-earth-700 mb-1">Any new flare-ups?</p>
          <p className="text-xs text-earth-400 mb-3">Select all that apply (optional)</p>
          <div className="flex flex-wrap gap-2">
            {FLARE_REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => toggleFlare(region)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border tap-target transition-colors duration-150 ${
                  flares.includes(region)
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-semibold text-earth-700 mb-2">Anything else to note? (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border-2 border-earth-100 bg-white px-4 py-3 text-earth-900 text-sm focus:outline-none focus:border-sunrise-500 transition-colors resize-none"
            placeholder="How did your body feel?"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button onClick={handleSubmit} disabled={!rating || submitting} className="w-full">
          {submitting ? 'Saving…' : 'Save & go home'}
        </Button>

        <button
          onClick={() => navigate('/')}
          className="text-center text-sm text-earth-400 underline tap-target"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
