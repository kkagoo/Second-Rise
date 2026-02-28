import React from 'react';

export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-150 tap-target px-6 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sunrise-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-sunrise-500 text-white hover:bg-sunrise-600 active:scale-95',
    secondary: 'bg-earth-100 text-earth-900 hover:bg-earth-200 active:scale-95',
    ghost:     'bg-transparent text-sunrise-600 hover:bg-sunrise-50 active:scale-95',
    outline:   'border-2 border-sunrise-500 text-sunrise-600 hover:bg-sunrise-50 active:scale-95',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
