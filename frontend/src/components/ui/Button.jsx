import React from 'react';

export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-2xl font-semibold transition-colors duration-150 tap-target px-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-blue-400 text-white hover:bg-blue-500 active:scale-[0.98]',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-[0.98]',
    ghost:     'bg-transparent text-gray-500 hover:bg-gray-100 active:scale-[0.98]',
    outline:   'border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98]',
    accent:    'bg-orange-400 text-white hover:bg-orange-500 active:scale-[0.98]',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
