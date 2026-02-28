import React from 'react';

export default function SessionProgress({ current, total, label }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-earth-500">{label}</span>
        <span className="text-xs text-earth-400">{current} of {total}</span>
      </div>
      <div className="h-2 bg-earth-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sunrise-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
