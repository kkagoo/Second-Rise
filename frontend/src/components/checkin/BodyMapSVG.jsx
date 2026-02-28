import React from 'react';

const ZONES = [
  {
    label: 'Upper body',
    regions: [
      { id: 'Neck',         emoji: '🫙', label: 'Neck' },
      { id: 'Shoulders',    emoji: '💪', label: 'Shoulders' },
      { id: 'Upper Back',   emoji: '🔙', label: 'Upper Back' },
    ],
  },
  {
    label: 'Core & back',
    regions: [
      { id: 'Core/Abdominal', emoji: '🫁', label: 'Core / Abs' },
      { id: 'Low Back',       emoji: '🔄', label: 'Low Back' },
    ],
  },
  {
    label: 'Lower body',
    regions: [
      { id: 'Hips',         emoji: '🦋', label: 'Hips' },
      { id: 'Knees',        emoji: '🦵', label: 'Knees' },
      { id: 'Feet/Ankles',  emoji: '🦶', label: 'Feet / Ankles' },
    ],
  },
  {
    label: 'Arms & hands',
    regions: [
      { id: 'Wrists/Hands', emoji: '✋', label: 'Wrists / Hands' },
    ],
  },
];

export default function BodyMapSVG({ selected, onToggle }) {
  return (
    <div className="flex flex-col gap-5">
      {ZONES.map((zone) => (
        <div key={zone.label}>
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-2">
            {zone.label}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {zone.regions.map((r) => {
              const isSelected = selected.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => onToggle(r.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl py-4 px-2 tap-target border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                      : 'border-earth-100 bg-white text-earth-600 hover:border-sunrise-200'
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="text-xs font-semibold leading-tight text-center">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <p className="text-xs text-earth-400 text-center">Tap again to deselect</p>
      )}
    </div>
  );
}
