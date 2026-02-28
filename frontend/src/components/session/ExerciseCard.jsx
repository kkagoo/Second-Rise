import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import ExerciseIllustration from './ExerciseIllustration';

// Countdown ring timer embedded in the card for timed exercises
function InlineTimer({ seconds, onComplete }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => { setRemaining(seconds); }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onComplete(); return; }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const r = 28;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#f0e8d8" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke="#f0722e"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-earth-900">{remaining}</span>
          <span className="text-xs text-earth-400">sec</span>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="text-xs text-sunrise-600 font-semibold underline"
      >
        Skip
      </button>
    </div>
  );
}

export default function ExerciseCard({ exercise, currentSet, isWarmup, isCooldown, onTimerComplete }) {
  if (isWarmup || isCooldown) {
    return (
      <Card>
        <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-3">
          {isWarmup ? '🔥 Warm-up' : '🧊 Cool-down'}
        </p>

        <ExerciseIllustration name={exercise.name} />

        <h2 className="text-xl font-bold text-earth-900 mt-4 mb-2">{exercise.name}</h2>
        <p className="text-earth-600 leading-relaxed text-sm">{exercise.instruction}</p>

        {exercise.duration_sec && (
          <InlineTimer seconds={exercise.duration_sec} onComplete={onTimerComplete} />
        )}
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-3">
        💪 Set {currentSet} of {exercise.sets} · {exercise.reps} reps
      </p>

      <ExerciseIllustration name={exercise.name} />

      <h2 className="text-xl font-bold text-earth-900 mt-4 mb-1">{exercise.name}</h2>

      <div className="mt-3 bg-earth-50 rounded-2xl p-3 border-l-4 border-sunrise-400">
        <p className="text-xs font-semibold text-sunrise-700 mb-1">Form cue</p>
        <p className="text-earth-700 text-sm leading-relaxed">{exercise.form_cue}</p>
      </div>
    </Card>
  );
}
