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
      {
        key: 'menopause_stage', label: 'Where are you in your menopause journey?',
        options: [
          { value: 'perimenopause',  label: 'Perimenopause' },
          { value: 'postmenopause',  label: 'Postmenopause' },
          { value: 'surgical',       label: 'Surgical menopause' },
          { value: 'unsure',         label: 'Not sure' },
        ],
      },
    ],
  },
  {
    title: 'Health history',
    fields: [
      {
        key: 'bone_health', label: 'Bone health status',
        options: [
          { value: 'normal',       label: 'Normal' },
          { value: 'osteopenia',   label: 'Osteopenia' },
          { value: 'osteoporosis', label: 'Osteoporosis' },
          { value: 'unknown',      label: 'I don\'t know' },
        ],
      },
      {
        key: 'pelvic_floor_history', label: 'Any pelvic floor history? (leakage, prolapse, pelvic pain)',
        options: [
          { value: true,  label: 'Yes' },
          { value: false, label: 'No' },
        ],
        boolean: true,
      },
    ],
  },
  {
    title: 'Joint concerns',
    fields: [
      {
        key: 'chronic_joints', label: 'Any chronic joint concerns? (select all that apply)',
        options: ['Knees', 'Hips', 'Low Back', 'Shoulders', 'Neck', 'Wrists/Hands', 'Feet/Ankles', 'Upper Back'],
        multi: true,
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
        options: ['dumbbells', 'resistance bands', 'mat', 'gym', 'chair', 'bodyweight only'],
        multi: true,
      },
    ],
  },
  {
    title: 'Preferences',
    fields: [
      {
        key: 'preferred_time', label: 'When do you prefer to work out?',
        options: [
          { value: 'morning', label: 'Morning' },
          { value: 'midday',  label: 'Midday' },
          { value: 'evening', label: 'Evening' },
          { value: 'varies',  label: 'It varies' },
        ],
      },
      {
        key: 'dinner_cooks_interest',
        label: 'Interested in quick "Train While Dinner Cooks" sessions? (15 min)',
        options: [
          { value: true,  label: 'Yes, love the idea!' },
          { value: false, label: 'Not really' },
        ],
        boolean: true,
      },
    ],
  },
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

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-cream flex flex-col px-5 pt-12 pb-8 safe-bottom">
      {/* Progress dots */}
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

          {currentStep.fields.map((field) => (
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
          ))}
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
          {saving ? 'Saving…' : isLast ? 'Finish setup' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
