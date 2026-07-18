import React, { useState } from 'react';

export const GOALS = [
  {
    id: 'build_strength',
    label: 'Build Strength',
    tagline: 'Muscle, bones, and feeling strong',
    icon: '💪',
  },
  {
    id: 'boost_energy',
    label: 'Boost Energy & Fitness',
    tagline: 'Feel capable and energised again',
    icon: '⚡️',
  },
  {
    id: 'sleep_stress',
    label: 'Sleep Better & Reduce Stress',
    tagline: 'Calm your system, rest deeper',
    icon: '🌙',
  },
  {
    id: 'mobility',
    label: 'Improve Mobility & Flexibility',
    tagline: 'Move with more ease and less ache',
    icon: '🤸',
  },
  {
    id: 'consistency',
    label: 'Move More Consistently',
    tagline: 'Build the habit without the pressure',
    icon: '📅',
  },
  {
    id: 'midlife',
    label: 'Support My Body Through Midlife',
    tagline: 'Bone health, pelvic floor, all of it',
    icon: '🌸',
  },
  {
    id: 'train_for',
    label: 'Train For Something',
    tagline: 'A hike, race, trip, or personal milestone',
    icon: '🎯',
  },
];

export const GOAL_MAP = Object.fromEntries(GOALS.map((g) => [g.id, g]));

const NEEDS_OPTIONS = [
  'Endurance', 'Strength', 'Mobility', 'Balance',
  'Confidence', 'Recovery', 'Skill practice',
];

/**
 * GoalSelector
 * @param {string}   value          - currently selected goal id
 * @param {object}   goalDetails    - parsed goal_details object (for train_for)
 * @param {string}   goalTargetDate - ISO date string for train_for event
 * @param {function} onChange(goalId, goalDetails, goalTargetDate) - called on any change
 */
export default function GoalSelector({ value, goalDetails = {}, goalTargetDate = '', onChange }) {
  const [trainDetails, setTrainDetails] = useState({
    what:       goalDetails?.what || '',
    success:    goalDetails?.success || '',
    hardest:    goalDetails?.hardest || '',
    workaround: goalDetails?.workaround || '',
    needs:      goalDetails?.needs || [],
  });
  const [targetDate, setTargetDate] = useState(goalTargetDate || '');

  function selectGoal(id) {
    if (id !== 'train_for') {
      onChange(id, null, null);
    } else {
      onChange(id, trainDetails, targetDate || null);
    }
  }

  function updateTrainField(field, val) {
    const next = { ...trainDetails, [field]: val };
    setTrainDetails(next);
    onChange('train_for', next, targetDate || null);
  }

  function toggleNeed(need) {
    const curr = trainDetails.needs || [];
    const next = curr.includes(need) ? curr.filter((n) => n !== need) : [...curr, need];
    updateTrainField('needs', next);
  }

  function updateTargetDate(d) {
    setTargetDate(d);
    onChange('train_for', trainDetails, d || null);
  }

  return (
    <div className="flex flex-col gap-2">
      {GOALS.map((g) => {
        const selected = value === g.id;
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => selectGoal(g.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `2px solid ${selected ? '#4BA3E3' : '#e5e7eb'}`,
                background: selected ? '#EFF8FF' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
              <span style={{ flex: 1 }}>
                <span style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: selected ? '#1d6fa4' : '#1f2937',
                  marginBottom: 1,
                }}>
                  {g.label}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: selected ? '#4BA3E3' : '#9ca3af' }}>
                  {g.tagline}
                </span>
              </span>
              {selected && (
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#4BA3E3', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>

            {/* Train For Something inline sub-form */}
            {g.id === 'train_for' && selected && (
              <div style={{
                margin: '8px 0 0',
                padding: '16px',
                background: '#f8fbff',
                borderRadius: '14px',
                border: '1px solid #d1e9f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <TrainField
                  label="What are you training for?"
                  placeholder="e.g. Machu Picchu hike, 5K run, ski trip…"
                  value={trainDetails.what}
                  onChange={(v) => updateTrainField('what', v)}
                />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    When is it? <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                  </p>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => updateTargetDate(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1.5px solid #d1d5db', fontSize: 14, color: '#374151',
                      background: '#fff', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <TrainField
                  label="What would success look like?"
                  placeholder="e.g. Complete the hike without stopping"
                  value={trainDetails.success}
                  onChange={(v) => updateTrainField('success', v)}
                  optional
                />
                <TrainField
                  label="What feels hardest about getting there?"
                  placeholder="e.g. Building cardio endurance"
                  value={trainDetails.hardest}
                  onChange={(v) => updateTrainField('hardest', v)}
                  optional
                />
                <TrainField
                  label="What should we work around?"
                  placeholder="e.g. Knee sensitivity, no jumping"
                  value={trainDetails.workaround}
                  onChange={(v) => updateTrainField('workaround', v)}
                  optional
                />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    What does your training need?{' '}
                    <span style={{ color: '#9ca3af', fontWeight: 400 }}>(select all that apply)</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {NEEDS_OPTIONS.map((need) => {
                      const active = (trainDetails.needs || []).includes(need);
                      return (
                        <button
                          key={need}
                          type="button"
                          onClick={() => toggleNeed(need)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: `1.5px solid ${active ? '#4BA3E3' : '#d1d5db'}`,
                            background: active ? '#EFF8FF' : '#fff',
                            color: active ? '#1d6fa4' : '#4b5563',
                            fontSize: 12,
                            fontWeight: active ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                          }}
                        >
                          {need}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrainField({ label, placeholder, value, onChange, optional }) {
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}{' '}
        {optional && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>}
      </p>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1.5px solid #d1d5db', fontSize: 14, color: '#374151',
          background: '#fff', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
