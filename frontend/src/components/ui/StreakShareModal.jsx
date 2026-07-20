import React from 'react';
import { Capacitor } from '@capacitor/core';

async function triggerShare(streak) {
  const text = `I've moved ${streak} days in a row with Second Rise 🔥 Every 7-day streak = $1 pledged to Girls Who Code. Join me → secondriseapp.com`;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text });
      return;
    } catch (err) {
      // fall through to web share
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (err) {
      // user cancelled or not supported — fall through to clipboard
    }
  }

  // Last resort: clipboard copy
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (err) {
    // silently ignore
  }
}

export default function StreakShareModal({ streak, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-7 flex flex-col items-center text-center">

        {/* Flame emoji */}
        <div className="text-6xl mb-3">🔥</div>

        {/* Headline */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {streak}-day streak!
        </h2>

        {/* Subtext */}
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          You showed up for yourself {streak} days in a row.
        </p>

        {/* Give back line */}
        <div className="w-full bg-blue-50 rounded-2xl px-4 py-3 mb-6">
          <p className="text-xs font-semibold text-blue-600 leading-snug">
            Second Rise pledges $1 to Girls Who Code for every 7-day streak.
          </p>
        </div>

        {/* Share button */}
        <button
          onClick={() => triggerShare(streak)}
          className="w-full bg-blue-400 hover:bg-blue-500 active:bg-blue-600 text-white font-bold rounded-2xl py-3 text-sm transition-colors mb-3"
        >
          Share your streak
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-400 hover:text-gray-600 font-medium py-2 transition-colors"
        >
          Maybe later
        </button>

      </div>
    </div>
  );
}
