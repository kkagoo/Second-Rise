import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseCard from '../components/session/ExerciseCard';
import RestTimer from '../components/session/RestTimer';
import SessionProgress from '../components/session/SessionProgress';
import Button from '../components/ui/Button';

// Flatten workout into a sequence of steps
function buildSteps(workout) {
  const steps = [];

  (workout.warmup || []).forEach((ex) => {
    steps.push({ type: 'warmup', exercise: ex, set: null });
  });

  (workout.main || []).forEach((ex) => {
    for (let s = 1; s <= ex.sets; s++) {
      steps.push({ type: 'main', exercise: ex, set: s });
      if (s < ex.sets) {
        steps.push({ type: 'rest', duration: ex.rest_sec, exercise: ex });
      }
    }
  });

  (workout.cooldown || []).forEach((ex) => {
    steps.push({ type: 'cooldown', exercise: ex, set: null });
  });

  return steps;
}

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rec, workout, session_type } = location.state || {};

  const [steps]       = useState(() => buildSteps(workout || {}));
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone]       = useState(false);

  const current = steps[stepIdx];

  const advance = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  }, [stepIdx, steps.length]);

  if (!workout) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-earth-500 mb-4">No session data found.</p>
          <Button onClick={() => navigate('/recommend')}>Back to recommendation</Button>
        </div>
      </div>
    );
  }

  // Count only non-rest steps for progress
  const exerciseSteps = steps.filter((s) => s.type !== 'rest');
  const exercisesDone = steps.slice(0, stepIdx + 1).filter((s) => s.type !== 'rest').length;

  if (done) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 safe-bottom gap-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h1 className="text-2xl font-bold text-earth-900 mb-2">Workout complete!</h1>
          <p className="text-earth-500">Amazing work. How did that feel?</p>
        </div>
        <Button
          className="w-full max-w-sm"
          onClick={() => navigate('/feedback', { state: { rec_id: rec?.rec_id } })}
        >
          Rate this session
        </Button>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-earth-400 underline tap-target"
        >
          Skip rating
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-5 pt-10 pb-8 safe-bottom">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-earth-500">{session_type}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-earth-400 underline tap-target"
          >
            End early
          </button>
        </div>

        {/* Progress */}
        <SessionProgress
          current={exercisesDone}
          total={exerciseSteps.length}
          label="Progress"
        />

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-center"
          >
            {current.type === 'rest' ? (
              <RestTimer seconds={current.duration} onComplete={advance} />
            ) : (
              <ExerciseCard
                exercise={current.exercise}
                currentSet={current.set}
                isWarmup={current.type === 'warmup'}
                isCooldown={current.type === 'cooldown'}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        {current.type !== 'rest' && (
          <div className="flex gap-3">
            <Button onClick={advance} className="flex-1">
              {stepIdx === steps.length - 1 ? 'Finish ✓' : 'Done ✓'}
            </Button>
            <Button variant="secondary" onClick={advance} className="flex-1">
              Skip →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
