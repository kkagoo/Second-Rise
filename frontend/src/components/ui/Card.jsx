import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-stone-200 p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
