import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';

const CATEGORIES = {
  'Cardio': ['Running', 'Walking', 'Hiking', 'Cycling', 'Elliptical', 'Rowing', 'Jump Rope', 'Stair Climber', 'Swimming', 'HIIT', 'Treadmill'],
  'Strength': ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Push Day', 'Pull Day', 'Leg Day', 'Powerlifting', 'Kettlebell', 'Olympic Lifting', 'Machines'],
  'Yoga & Flexibility': ['Vinyasa Yoga', 'Hatha Yoga', 'Restorative Yoga', 'Yin Yoga', 'Hot Yoga', 'Power Yoga', 'Pilates', 'Barre', 'Stretching', 'Aerial Yoga'],
  'Mind & Body': ['Meditation', 'Breathwork', 'Tai Chi', 'Qigong', 'Journaling', 'Foam Rolling', 'Sauna', 'Massage', 'Acupuncture', 'Cold Plunge'],
  'Outdoor': ['Trail Running', 'Mountain Biking', 'Rock Climbing', 'Kayaking', 'Paddleboarding', 'Surfing', 'Skiing', 'Snowboarding', 'Gardening', 'Beach Walk'],
  'Sports': ['Tennis', 'Pickleball', 'Golf', 'Basketball', 'Soccer', 'Volleyball', 'Softball', 'Badminton', 'Frisbee', 'Dancing'],
  'Functional': ['CrossFit', 'Circuit Training', 'Bootcamp', 'TRX', 'Bodyweight', 'Calisthenics', 'Functional Training', 'Agility Drills'],
  'Cycling': ['Outdoor Cycling', 'Indoor Cycling', 'Spinning', 'Peloton', 'Mountain Biking', 'Stationary Bike'],
  'Water': ['Lap Swim', 'Open Water Swim', 'Water Aerobics', 'Snorkeling', 'Aqua Jogging'],
  'Dance & Combat': ['Zumba', 'Hip Hop Dance', 'Ballet', 'Kickboxing', 'Boxing', 'Martial Arts', 'Jiu-Jitsu', 'Muay Thai', 'Karate'],
  'Recovery': ['Rest Day', 'Active Recovery', 'Physical Therapy', 'Chiropractic', 'Gentle Walk', 'Light Stretching'],
};

const CATEGORY_ICONS = {
  'Cardio': '🏃',
  'Strength': '💪',
  'Yoga & Flexibility': '🧘',
  'Mind & Body': '🧠',
  'Outdoor': '🌿',
  'Sports': '🎾',
  'Functional': '⚡',
  'Cycling': '🚴',
  'Water': '🏊',
  'Dance & Combat': '🥊',
  'Recovery': '💤',
};

const INTENSITY_OPTIONS = [
  { value: 'easy',     label: 'Easy',     color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'hard',     label: 'Hard',     color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'max',      label: 'Max',      color: 'bg-red-100 text-red-700 border-red-300' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function LogActivityPage() {
  const navigate   = useNavigate();
  const location   = useLocation();

  // Pre-fill from video library "Log It" button
  const prefill = location.state || {};

  const [step, setStep]             = useState(prefill.activity ? 3 : 1); // skip to confirm if pre-filled
  const [selectedCategory, setCategory] = useState(prefill.category || '');
  const [selectedActivity, setActivity] = useState(prefill.activity || '');
  const [activityDate, setDate]     = useState(prefill.date || todayStr());
  const [duration, setDuration]     = useState(prefill.duration_min ? String(prefill.duration_min) : '');
  const [intensity, setIntensity]   = useState(prefill.intensity || 'moderate');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await client.post('/activity', {
        activity_date: activityDate,
        category:      selectedCategory,
        activity:      selectedActivity,
        duration_min:  duration ? Number(duration) : null,
        intensity,
        notes:         notes || null,
        source:        prefill.source || 'manual',
        video_id:      prefill.video_id || null,
      });
      setDone(true);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 pb-28">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Logged!</h2>
        <p className="text-sm text-gray-400 text-center mb-8">
          {selectedActivity} on {activityDate} has been saved.
        </p>
        <button
          onClick={() => { setDone(false); setStep(1); setCategory(''); setActivity(''); setDuration(''); setNotes(''); }}
          className="w-full max-w-xs bg-blue-400 text-white font-semibold rounded-2xl py-3.5 tap-target mb-3"
        >
          Log another
        </button>
        <button
          onClick={() => navigate('/history')}
          className="w-full max-w-xs border border-gray-200 text-gray-700 font-semibold rounded-2xl py-3.5 tap-target"
        >
          View history
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-blue-400 text-sm font-semibold mb-3 tap-target">
          ← Back
        </button>
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Track</p>
        <h1 className="text-2xl font-bold text-gray-900">Log Activity</h1>

        {/* Step indicator */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-400' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="px-5">
        {/* ── Step 1: Pick category ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <p className="text-base font-semibold text-gray-900 mb-4">What type of activity?</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setStep(2); }}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-left tap-target transition-all ${
                    selectedCategory === cat
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-100 bg-white hover:border-blue-200'
                  }`}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">{cat}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Pick activity ──────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep(1)} className="text-blue-400 text-sm tap-target">← back</button>
              <span className="text-base font-semibold text-gray-900">
                {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(CATEGORIES[selectedCategory] || []).map((act) => (
                <button
                  key={act}
                  onClick={() => { setActivity(act); setStep(3); }}
                  className="px-4 py-2.5 rounded-2xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-800 tap-target hover:border-blue-400 transition-colors"
                >
                  {act}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 3: Details ──────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            {/* Activity summary */}
            <div className="bg-sky-card rounded-2xl p-4 flex items-center gap-3 mb-5">
              <span className="text-3xl">{CATEGORY_ICONS[selectedCategory]}</span>
              <div>
                <p className="text-xs text-blue-400 font-semibold">{selectedCategory}</p>
                <p className="text-base font-bold text-gray-900">{selectedActivity}</p>
              </div>
              {!prefill.activity && (
                <button onClick={() => setStep(2)} className="ml-auto text-xs text-blue-400 font-semibold tap-target">
                  Change
                </button>
              )}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date</label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setDate(e.target.value)}
                max={todayStr()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45"
                min="1"
                max="480"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Intensity */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Intensity</label>
              <div className="grid grid-cols-4 gap-2">
                {INTENSITY_OPTIONS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setIntensity(value)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-semibold tap-target transition-all ${
                      intensity === value ? color + ' border-current' : 'border-gray-200 text-gray-500 bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Notes <span className="normal-case text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel? Any aches?"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 mb-3">{error}</p>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-blue-400 text-white font-bold text-base rounded-2xl py-4 tap-target disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save activity'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
