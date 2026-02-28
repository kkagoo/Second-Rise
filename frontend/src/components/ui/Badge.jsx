import React from 'react';

export default function Badge({ children, color = 'sunrise', className = '' }) {
  const colors = {
    sunrise: 'bg-sunrise-50 text-sunrise-700',
    earth:   'bg-earth-100 text-earth-700',
    green:   'bg-green-50 text-green-700',
    red:     'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
