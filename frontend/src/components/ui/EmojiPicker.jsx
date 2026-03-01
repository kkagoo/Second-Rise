import React from 'react';

const OPTIONS = [
  { value: 20, label: 'Wrecked', sub: 'need rest' },
  { value: 40, label: 'Low',     sub: 'take it easy' },
  { value: 65, label: 'Good',    sub: 'ready to move' },
  { value: 85, label: 'Strong',  sub: "let's go" },
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
            className={`flex flex-col items-start gap-0.5 rounded-2xl px-4 py-4 tap-target text-left transition-all duration-150 border-2 ${
              selected
                ? 'bg-blue-400 border-blue-400 text-white'
                : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300'
            }`}
          >
            <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-gray-900'}`}>
              {opt.label}
            </span>
            <span className={`text-xs ${selected ? 'text-blue-100' : 'text-gray-400'}`}>
              {opt.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
