import React from 'react';

const OPTIONS = [
  { value: 20, label: 'Wrecked',  sub: 'need rest' },
  { value: 40, label: 'Low',      sub: 'take it easy' },
  { value: 65, label: 'Good',     sub: 'ready to move' },
  { value: 85, label: 'Strong',   sub: 'let\'s go' },
];

export default function EmojiPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-start gap-0.5 rounded-xl px-4 py-4 tap-target text-left transition-all duration-150 border ${
              selected
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'bg-white border-stone-200 text-stone-800 hover:border-stone-400'
            }`}
          >
            <span className={`text-sm font-semibold ${selected ? 'text-white' : 'text-stone-900'}`}>
              {opt.label}
            </span>
            <span className={`text-xs ${selected ? 'text-stone-300' : 'text-stone-400'}`}>
              {opt.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
