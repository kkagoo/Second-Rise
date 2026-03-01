import React from 'react';

export default function Badge({ children, color = 'default', className = '' }) {
  const colors = {
    default: 'bg-gray-100 text-gray-600',
    sunrise: 'bg-orange-50 text-orange-500',
    blue:    'bg-sky-card text-blue-500',
    green:   'bg-green-50 text-green-700',
    red:     'bg-red-50 text-red-600',
    earth:   'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors[color] || colors.default} ${className}`}>
      {children}
    </span>
  );
}
