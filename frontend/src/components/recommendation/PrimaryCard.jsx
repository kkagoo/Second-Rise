import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function PrimaryCard({ rec, onStart }) {
  return (
    <Card className="border-2 border-sunrise-200">
      <div className="flex items-center justify-between mb-3">
        <Badge color="sunrise">Recommended for today</Badge>
        {rec.duration_min && (
          <span className="text-xs text-earth-400 font-medium">{rec.duration_min} min</span>
        )}
      </div>
      <h2 className="text-xl font-bold text-earth-900 mb-2">{rec.primary_session_type}</h2>
      <p className="text-earth-600 text-sm leading-relaxed mb-5">{rec.primary_reasoning}</p>

      {rec.primary_workout && (
        <div className="text-xs text-earth-400 mb-5 space-y-1">
          <p>Warm-up: {rec.primary_workout.warmup?.length ?? 0} movements</p>
          <p>Main: {rec.primary_workout.main?.length ?? 0} exercises</p>
          <p>Cool-down: {rec.primary_workout.cooldown?.length ?? 0} stretches</p>
        </div>
      )}

      <Button onClick={onStart} className="w-full">
        Start Session
      </Button>
    </Card>
  );
}
