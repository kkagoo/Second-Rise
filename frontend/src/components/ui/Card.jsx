import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-earth-100 p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
