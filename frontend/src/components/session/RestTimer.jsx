import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function RestTimer({ seconds, onComplete }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const pct = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="text-sm font-semibold text-earth-500 uppercase tracking-widest">Rest</p>
      <div className="relative w-28 h-28">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#f0e8d8" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="#f0722e"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-earth-900">{remaining}</span>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="text-sm text-sunrise-600 font-semibold underline tap-target"
      >
        Skip rest
      </button>
    </div>
  );
}
