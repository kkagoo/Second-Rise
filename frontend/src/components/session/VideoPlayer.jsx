import React, { useState } from 'react';

// YouTube embedding is blocked in iOS/Android WebView (Error 153).
// Instead we open the YouTube app directly via deep link, falling back to the web URL.
export default function VideoPlayer({ youtubeId, title }) {
  const thumb = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  const [launched, setLaunched] = useState(false);

  function openYouTube() {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
    setLaunched(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative rounded-3xl overflow-hidden aspect-video cursor-pointer group"
        onClick={openYouTube}
      >
        <img
          src={thumb}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`; }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-200" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <svg className="w-7 h-7 ml-1" fill="#ea580c" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold drop-shadow">
          Tap to open in YouTube
        </p>
      </div>

      {/* Return-to-app prompt — shown after YouTube launches */}
      {launched && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">👋</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-700 leading-snug">
              Come back when you're done!
            </p>
            <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">
              Return to this screen after your workout to log your session and keep your streak going.
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLaunched(false); }}
            className="text-blue-300 hover:text-blue-500 flex-shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
