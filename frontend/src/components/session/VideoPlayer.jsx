import React from 'react';

// YouTube embedding is blocked in iOS/Android WebView (Error 153).
// Instead we open the YouTube app directly via deep link, falling back to the web URL.
export default function VideoPlayer({ youtubeId, title }) {
  const thumb = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  function openYouTube() {
    // Try YouTube app first; browsers/OS will fall back to youtube.com if not installed
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
  }

  return (
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
  );
}
