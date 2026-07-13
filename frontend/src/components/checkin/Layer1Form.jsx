import React, { useState } from 'react';
import EmojiPicker from '../ui/EmojiPicker';

const TIME_OPTIONS = [
  { value: '15',  label: '15 min' },
  { value: '20',  label: '20 min' },
  { value: '30',  label: '30 min' },
  { value: '35+', label: '35+ min' },
];

const WORKOUT_PREFS = [
  { value: 'surprise',  label: '✨ Surprise me' },
  { value: 'strength',  label: '🏋️ Strength' },
  { value: 'cardio',    label: '🚶 Cardio' },
  { value: 'yoga',      label: '🧘 Yoga / Mobility' },
  { value: 'pilates',   label: '🌀 Pilates' },
  { value: 'gentle',    label: '💙 Something gentle' },
];

const SLEEP_LABELS = {
  1: '😴 Very poor',
  2: '😕 Poor',
  3: '😐 OK',
  4: '🙂 Good',
  5: '😊 Great',
};

// Show cycle question for perimenopause and not-sure users
const SHOW_CYCLE_FOR = ['perimenopause', 'not_sure'];

export default function Layer1Form({ onComplete, suggestion = null, tempFlag = false, menopauseStage = null, hasBiometrics = false, hasCycleConsent = false }) {
  const [energy, setEnergy]           = useState(suggestion);
  const [time, setTime]               = useState(null);
  const [painFlag, setPainFlag]       = useState(null);
  const [workoutPref, setWorkoutPref] = useState('surprise');
  const [sleepQuality, setSleepQuality] = useState(null);
  const [menstruating, setMenstruating] = useState(null);

  const showCycleQuestion = hasCycleConsent && SHOW_CYCLE_FOR.includes(menopauseStage);
  const showSleepQuestion = !hasBiometrics;

  const canProceed = energy !== null && time !== null && painFlag !== null;

  function handleComplete() {
    if (!canProceed) return;
    onComplete({
      energy,
      time,
      painFlag,
      workoutPref,
      sleepQuality: showSleepQuestion ? sleepQuality : null,
      menstruating:  showCycleQuestion ? menstruating : null,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Energy */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">How's your energy?</h2>
        <EmojiPicker value={energy} onChange={setEnergy} suggestion={suggestion} />
      </section>

      {/* Self-reported sleep (no wearable only) */}
      {showSleepQuestion && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">How did you sleep?</h2>
          <p className="text-xs text-gray-400 mb-3">Optional — helps us calibrate your workout.</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setSleepQuality(sleepQuality === n ? null : n)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold tap-target border-2 transition-all duration-150 flex flex-col items-center gap-1 ${
                  sleepQuality === n
                    ? 'bg-blue-400 border-blue-400 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="text-base">{SLEEP_LABELS[n].split(' ')[0]}</span>
                <span className="text-xs">{n}</span>
              </button>
            ))}
          </div>
          {sleepQuality && (
            <p className="text-xs text-gray-400 mt-2 text-center">{SLEEP_LABELS[sleepQuality]}</p>
          )}
        </section>
      )}

      {/* Time available */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">How much time do you have?</h2>
        <div className="grid grid-cols-4 gap-2">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTime(t.value)}
              className={`rounded-2xl py-3.5 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
                time === t.value
                  ? 'bg-blue-400 border-blue-400 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Workout preference */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1">What are you in the mood for?</h2>
        <p className="text-xs text-gray-400 mb-3">We'll balance your week — but we'll honour your preference too.</p>
        <div className="grid grid-cols-2 gap-2">
          {WORKOUT_PREFS.map((p) => (
            <button
              key={p.value}
              onClick={() => setWorkoutPref(p.value)}
              className={`rounded-2xl py-3 text-sm font-semibold tap-target border-2 transition-all duration-150 text-left px-4 ${
                workoutPref === p.value
                  ? 'bg-blue-400 border-blue-400 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* Cycle question (perimenopause / not sure only) */}
      {showCycleQuestion && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Are you on your period?</h2>
          <p className="text-xs text-gray-400 mb-3">Optional — helps us adjust intensity for you.</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'yes',     label: 'Yes' },
              { value: 'no',      label: 'No' },
              { value: 'unsure',  label: 'Not sure' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMenstruating(menstruating === opt.value ? null : opt.value)}
                className={`rounded-2xl py-3.5 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
                  menstruating === opt.value
                    ? 'bg-rose-400 border-rose-400 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-rose-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pain check */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Any pain or discomfort?</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPainFlag(false)}
            className={`rounded-2xl py-4 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
              painFlag === false
                ? 'bg-blue-400 border-blue-400 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
            }`}
          >
            Feeling good
          </button>
          <button
            onClick={() => setPainFlag(true)}
            className={`rounded-2xl py-4 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
              painFlag === true
                ? 'bg-blue-400 border-blue-400 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
            }`}
          >
            Yes, note it
          </button>
        </div>
      </section>

      <button
        onClick={handleComplete}
        disabled={!canProceed}
        className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed tap-target"
      >
        {painFlag ? 'Continue →' : 'Get my workout →'}
      </button>
    </div>
  );
}
