import React from 'react';
import { motion } from 'framer-motion';

const OPTIONS = [
  { value: 20, emoji: '💀', label: 'Wrecked' },
  { value: 40, emoji: '😐', label: 'Meh' },
  { value: 65, emoji: '✊', label: 'Solid' },
  { value: 85, emoji: '🔥', label: 'Strong' },
];

export default function EmojiPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 rounded-2xl p-4 tap-target transition-all duration-150 border-2 ${
              selected
                ? 'border-sunrise-500 bg-sunrise-50'
                : 'border-earth-100 bg-white hover:border-sunrise-200'
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className={`text-xs font-semibold ${selected ? 'text-sunrise-700' : 'text-earth-500'}`}>
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
