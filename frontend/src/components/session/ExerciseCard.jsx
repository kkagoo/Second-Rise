import React from 'react';
import Card from '../ui/Card';

export default function ExerciseCard({ exercise, currentSet, isWarmup, isCooldown }) {
  if (isWarmup || isCooldown) {
    return (
      <Card className="text-center">
        <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-2">
          {isWarmup ? 'Warm-up' : 'Cool-down'}
        </p>
        <h2 className="text-2xl font-bold text-earth-900 mb-2">{exercise.name}</h2>
        <p className="text-earth-600 leading-relaxed">{exercise.instruction}</p>
        <p className="mt-3 text-sm text-sunrise-600 font-semibold">
          {exercise.duration_sec}s
        </p>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-2">
        Set {currentSet} of {exercise.sets}
      </p>
      <h2 className="text-2xl font-bold text-earth-900 mb-1">{exercise.name}</h2>
      <p className="text-sunrise-600 font-semibold mb-4">{exercise.reps} reps</p>
      <p className="text-earth-600 leading-relaxed text-sm">{exercise.form_cue}</p>
    </Card>
  );
}
