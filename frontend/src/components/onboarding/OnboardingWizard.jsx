import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import client from '../../api/client';
import { Capacitor } from '@capacitor/core';
import GoalSelector from '../GoalSelector';

async function openOAuth(url) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch {
    window.location.href = url;
  }
}

const WEARABLE_ENDPOINTS = {
  oura:         '/oura/connect',
  whoop:        '/whoop/connect',
  google_fit:   '/googlefit/connect',
  withings:     '/withings/connect',
  apple_health: null, // native HealthKit — connect from Profile
};

const STEPS = [
  {
    title: "What's your movement goal?",
    subtitle: 'Shapes your daily recommendations. You can change this any time from your Profile.',
    custom: 'goal',
  },
  {
    title: 'About you',
    fields: [
      {
        key: 'age_range', label: 'Age range',
        options: ['40-44', '45-49', '50-54', '55-60', '61-65', '65+'],
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
    title: 'Do you have a wearable?',
    subtitle: 'Optional — you can connect it from your Profile after setup.',
    custom: 'wearable',
  },
];

// id matches the profile page connect button keys
const isIOS = Capacitor.getPlatform() === 'ios';

const isAndroid = Capacitor.getPlatform() === 'android';

const WEARABLES = [
  { id: 'oura',         label: 'Oura Ring',    badge: 'O', bg: '#1a1a2e', fg: '#fff' },
  { id: 'whoop',        label: 'Whoop',         badge: 'W', bg: '#111827', fg: '#fff' },
  ...(!isAndroid ? [{ id: 'apple_health', label: 'Apple Health', badge: 'A', bg: '#ef4444', fg: '#fff', note: isIOS ? null : 'file import' }] : []),
  { id: 'google_fit',   label: 'Google Health', badge: 'G', bg: '#4285F4', fg: '#fff', note: 'incl. Fitbit' },
  { id: 'withings',     label: 'Withings',      badge: 'W', bg: '#0070CC', fg: '#fff' },
];

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl px-4 py-3 text-sm font-medium border-2 tap-target transition-all duration-150 ${
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
  const [welcomed, setWelcomed] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedWearable, setSelectedWearable] = useState(null);
  const [connectingWearable, setConnectingWearable] = useState(null);
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
    if (currentStep.custom === 'wearable') return true; // optional
    if (currentStep.custom === 'goal') {
      if (!answers.goal) return false;
      if (answers.goal === 'train_for') {
        // Require at least a "what" answer for Train For Something
        return !!(answers.goal_details?.what?.trim());
      }
      return true;
    }
    return currentStep.fields.every((f) => {
      const val = answers[f.key];
      if (f.multi) return true; // multi is optional
      return val !== undefined && val !== null && val !== '';
    });
  }

  // Tapping a wearable card immediately opens OAuth (or HealthKit on iOS) — no second button needed.
  async function handleWearableTap(wearableId) {
    const alreadySelected = selectedWearable === wearableId;
    if (alreadySelected) {
      setSelectedWearable(null);
      return;
    }
    setSelectedWearable(wearableId);

    // Apple Health on iOS → request HealthKit permissions natively
    if (wearableId === 'apple_health' && isIOS) {
      setConnectingWearable(wearableId);
      try {
        const { HealthKit } = await import('../plugins/HealthKit');
        await HealthKit.requestHKPermissions();
        await HealthKit.syncToday().then((data) => client.post('/healthkit/sync', data)).catch(() => {});
      } catch {
        // silently ignore — they can sync from Profile
      } finally {
        setConnectingWearable(null);
      }
      return;
    }

    const endpoint = WEARABLE_ENDPOINTS[wearableId];
    if (!endpoint) return; // no OAuth endpoint — just save preference
    setConnectingWearable(wearableId);
    try {
      const res = await client.get(endpoint, { params: { returnTo: '/profile' } });
      await openOAuth(res.data.url); // opens in-app browser; returns when user closes it
    } catch {
      // silently ignore — they can connect from Profile
    } finally {
      setConnectingWearable(null);
    }
  }

  async function handleFinish() {
    setSaving(true);
    setError('');
    try {
      await client.put('/profile', { ...answers, onboarding_complete: true });
      onComplete(selectedWearable);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!welcomed) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', padding: '48px 20px 20px' }}>
          <div className="text-4xl mb-6">🌅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Welcome — we're so glad you're here.
          </h1>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            Second Rise is built for women navigating perimenopause and beyond. Every recommendation is shaped around you — your energy, your body, your stage.
          </p>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            We have a few quick questions to make things as useful as possible. Everything is optional — you can always skip and update from your Profile later.
          </p>
          <p className="text-gray-400 text-sm">Takes about 1 minute.</p>
        </div>

        <div style={{ padding: '12px 20px 40px', borderTop: '1px solid #f3f4f6', background: '#fff' }}>
          <button
            onClick={() => setWelcomed(true)}
            style={{ width: '100%', background: '#4BA3E3', color: '#fff', fontWeight: 600, borderRadius: '1rem', padding: '16px', fontSize: '16px', border: 'none' }}
          >
            Let's go →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scrollable content area — minHeight:0 is required for flex+overflow to work on iOS */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '20px' }}>
        {/* Progress bar */}
        <div className="flex gap-2 mb-4">
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
          className="flex flex-col gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="text-2xl font-bold text-earth-900">{currentStep.title}</h1>
            {currentStep.subtitle && (
              <p className="text-sm text-gray-400 mt-1">{currentStep.subtitle}</p>
            )}
          </div>

          {currentStep.custom === 'goal' ? (
            <GoalSelector
              value={answers.goal}
              goalDetails={answers.goal_details}
              goalTargetDate={answers.goal_target_date}
              onChange={(goalId, goalDetails, goalTargetDate) => {
                setAnswers((prev) => ({
                  ...prev,
                  goal: goalId,
                  goal_details: goalDetails,
                  goal_target_date: goalTargetDate,
                }));
              }}
            />
          ) : currentStep.custom === 'wearable' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">
                Tap your device to connect it now. You can also do this from your Profile later.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {WEARABLES.map((w) => {
                  const isSelected = selectedWearable === w.id;
                  const isConnecting = connectingWearable === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleWearableTap(w.id)}
                      disabled={connectingWearable !== null}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px', borderRadius: '14px', border: 'none',
                        background: isSelected ? w.bg : '#f9fafb',
                        cursor: connectingWearable ? 'wait' : 'pointer', textAlign: 'left',
                        outline: isSelected ? `2px solid ${w.bg}` : '2px solid transparent',
                        opacity: connectingWearable && !isConnecting ? 0.5 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: isSelected ? '#fff3' : w.bg,
                        color: isSelected ? '#fff' : w.fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 15, flexShrink: 0,
                      }}>
                        {isConnecting ? '…' : w.badge}
                      </div>
                      <span style={{ lineHeight: 1.3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#fff' : '#374151', display: 'block' }}>
                          {isConnecting ? 'Opening…' : w.label}
                        </span>
                        {!isConnecting && w.note && (
                          <span style={{ fontSize: 11, color: isSelected ? '#ffffffaa' : '#9ca3af' }}>
                            {w.note}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setSelectedWearable(null)}
                style={{ fontSize: 13, color: '#9ca3af', background: 'none', border: 'none', padding: '4px 0', textAlign: 'left', cursor: 'pointer', textDecoration: selectedWearable === null ? 'underline' : 'none' }}
              >
                I don't have a wearable right now
              </button>
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
      </div>{/* end scrollable area */}

      {/* Sticky bottom nav — always visible */}
      <div style={{ padding: '12px 20px 40px', borderTop: '1px solid #f3f4f6', background: '#fff', display: 'flex', gap: '12px' }}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{ flex: 1, background: '#f3f4f6', color: '#374151', fontWeight: 600, borderRadius: '1rem', padding: '16px', fontSize: '16px', border: 'none' }}
          >
            Back
          </button>
        )}
        <button
          onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
          disabled={!isStepComplete() || saving}
          style={{ flex: 1, background: (!isStepComplete() || saving) ? '#93c5fd' : '#4BA3E3', color: '#fff', fontWeight: 600, borderRadius: '1rem', padding: '16px', fontSize: '16px', border: 'none', opacity: (!isStepComplete() || saving) ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : isLast ? 'Start my journey →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
