import React from 'react';

export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 tap-target px-6 py-3 text-sm tracking-tight focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]',
    secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-[0.98]',
    ghost:     'bg-transparent text-stone-600 hover:bg-stone-100 active:scale-[0.98]',
    outline:   'border border-stone-300 text-stone-800 hover:bg-stone-50 active:scale-[0.98]',
    accent:    'bg-accent-500 text-white hover:bg-accent-600 active:scale-[0.98]',
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
