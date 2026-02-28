import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
