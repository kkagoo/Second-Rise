import React from 'react';

const ZONES = [
  {
    label: 'Upper body',
    regions: [
      { id: 'Neck',         label: 'Neck' },
      { id: 'Shoulders',    label: 'Shoulders' },
      { id: 'Upper Back',   label: 'Upper back' },
    ],
  },
  {
    label: 'Core & back',
    regions: [
      { id: 'Core/Abdominal', label: 'Core / abs' },
      { id: 'Low Back',       label: 'Low back' },
    ],
  },
  {
    label: 'Lower body',
    regions: [
      { id: 'Hips',         label: 'Hips' },
      { id: 'Knees',        label: 'Knees' },
      { id: 'Feet/Ankles',  label: 'Feet & ankles' },
    ],
  },
  {
    label: 'Arms & hands',
    regions: [
      { id: 'Wrists/Hands', label: 'Wrists & hands' },
    ],
  },
];

export default function BodyMapSVG({ selected, onToggle }) {
  return (
    <div className="flex flex-col gap-4">
      {ZONES.map((zone) => (
        <div key={zone.label}>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">
            {zone.label}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {zone.regions.map((r) => {
              const isSelected = selected.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => onToggle(r.id)}
                  className={`rounded-xl py-3 px-2 tap-target text-center text-sm font-medium border transition-all duration-150 ${
                    isSelected
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <p className="text-xs text-stone-400 text-center">Tap again to deselect</p>
      )}
    </div>
  );
}
