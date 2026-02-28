import React from 'react';

export default function Badge({ children, color = 'default', className = '' }) {
  const colors = {
    default: 'bg-stone-100 text-stone-600',
    sunrise: 'bg-accent-50 text-accent-700',
    earth:   'bg-stone-100 text-stone-600',
    green:   'bg-green-50 text-green-700',
    red:     'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colors[color] || colors.default} ${className}`}>
      {children}
    </span>
  );
}
