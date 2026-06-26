import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import client from '../../api/client';

const STEPS = [
  {
    title: 'About you',
    fields: [
      {
        key: 'age_range', label: 'Age range',
        options: ['40-44', '45-49', '50-54', '55-60'],
      },
    ],
  },
  {
    title: 'Your menopause journey',
    fields: [
      {
        key: 'menopause_stage',
        label: 'Where are you in your journey?',
        options: [
          { value: 'perimenopause',      label: 'Perimenopause — periods are changing' },
          { value: 'early_menopause',    label: 'Early menopause (within 5 years)' },
          { value: 'postmenopause',      label: 'Postmenopause (5+ years)' },
          { value: 'surgical_menopause', label: 'Surgical menopause' },
          { value: 'not_sure',           label: 'Not sure / still figuring it out' },
          { value: 'not_applicable',     label: 'Not applicable' },
        ],
      },
    ],
  },
  {
    title: 'Activity & equipment',
    fields: [
      {
        key: 'activity_baseline', label: 'Your current activity level',
        options: [
          { value: 'sedentary', label: 'Sedentary (mostly sitting)' },
          { value: 'light',     label: 'Light (occasional walks)' },
          { value: 'moderate',  label: 'Moderate (2–3x/week)' },
          { value: 'active',    label: 'Active (4+ days/week)' },
        ],
      },
      {
        key: 'equipment_available', label: 'Equipment you have access to',
        options: ['dumbbells', 'resistance bands', 'bodyweight only'],
        multi: true,
      },
    ],
  },
  {
    title: 'Connect your device',
    custom: 'wearable',
  },
];

const WEARABLES = [
  { label: 'Oura Ring',                icon: '💍', color: 'bg-violet-50 border-violet-200' },
  { label: 'Whoop',                    icon: '⌚', color: 'bg-blue-50 border-blue-200' },
  { label: 'Apple Health',             icon: '🍎', color: 'bg-red-50 border-red-200' },
  { label: 'Google Fit / Pixel Watch', icon: '📱', color: 'bg-green-50 border-green-200' },
  { label: 'Fitbit',                   icon: '🔴', color: 'bg-teal-50 border-teal-200' },
  { label: 'Withings',                 icon: '🔵', color: 'bg-cyan-50 border-cyan-200' },
];

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl px-4 py-3 text-sm font-medium border-2 tap-target transition-all duration-150 ${
        selected
          ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
          : 'border-earth-100 bg-white text-earth-700 hover:border-sunrise-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function setValue(key, value, multi = false) {
    if (multi) {
      setAnswers((prev) => {
        const arr = prev[key] || [];
        return {
          ...prev,
          [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
        };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [key]: value }));
    }
  }

  function isStepComplete() {
    if (currentStep.custom === 'wearable') return true; // optional step
    return currentStep.fields.every((f) => {
      const val = answers[f.key];
      if (f.multi) return true; // multi is optional
      return val !== undefined && val !== null && val !== '';
    });
  }

  async function handleFinish() {
    setSaving(true);
    setError('');
    try {
      await client.put('/profile', { ...answers, onboarding_complete: true });
      onComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-5 pt-12 pb-8 safe-bottom">
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-sunrise-500' : 'bg-earth-100'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col gap-6"
        >
          <div>
            <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="text-2xl font-bold text-earth-900">{currentStep.title}</h1>
          </div>

          {currentStep.custom === 'wearable' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-earth-600">
                Second Rise works best with your sleep and recovery data. Connect your device anytime from your Profile.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WEARABLES.map((w) => (
                  <div
                    key={w.label}
                    className={`rounded-2xl border-2 px-3 py-3 text-sm font-medium flex items-center gap-2 ${w.color}`}
                  >
                    <span className="text-lg">{w.icon}</span>
                    <span className="text-earth-700 leading-tight">{w.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-earth-400 mt-1">
                No wearable? No problem — you can log how you feel each day and still get a great workout recommendation.
              </p>
            </div>
          ) : (
            currentStep.fields.map((field) => (
              <div key={field.key}>
                <p className="text-sm font-semibold text-earth-700 mb-3">{field.label}</p>
                <div className="flex flex-col gap-2">
                  {field.options.map((opt) => {
                    const val  = typeof opt === 'string' ? opt : opt.value;
                    const lbl  = typeof opt === 'string' ? opt : opt.label;
                    const curr = answers[field.key];
                    const selected = field.multi
                      ? (curr || []).includes(val)
                      : curr === val;
                    return (
                      <OptionButton
                        key={String(val)}
                        label={lbl}
                        selected={selected}
                        onClick={() => setValue(field.key, val, field.multi)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex-1">
            Back
          </Button>
        )}
        <Button
          onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
          disabled={!isStepComplete() || saving}
          className="flex-1"
        >
          {saving ? 'Saving…' : isLast ? 'Start my journey →' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
