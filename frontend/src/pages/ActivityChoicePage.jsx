import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActivityChoicePage() {
  const navigate = useNavigate();

  return (
    // Scrim — tap outside to dismiss
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={() => navigate(-1)}
    >
      {/* Sheet — stop propagation so tapping inside doesn't dismiss */}
      <div
        className="bg-white rounded-t-3xl px-5 pt-5 pb-10 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Move</p>
        <h2 className="text-xl font-bold text-gray-900 mb-5">What do you want to do?</h2>

        {/* Option 1 — Video workout */}
        <button
          onClick={() => navigate('/videos')}
          className="w-full flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-3 tap-target text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex-shrink-0 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M10 9l6 3-6 3V9z" fill="#4BA3E3" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm mb-0.5">Start a video workout</p>
            <p className="text-xs text-gray-400">Browse yoga, strength, cardio and more</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Option 2 — Log activity */}
        <button
          onClick={() => navigate('/log-activity')}
          className="w-full flex items-center gap-4 bg-green-50 border border-green-100 rounded-2xl p-4 tap-target text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-green-100 flex-shrink-0 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm mb-0.5">Log an activity</p>
            <p className="text-xs text-gray-400">Running, hiking, strength, yoga and more</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
