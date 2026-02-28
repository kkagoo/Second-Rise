import React, { useState } from 'react';

export default function VideoPlayer({ youtubeId, title }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  if (!playing) {
    return (
      <div
        className="relative rounded-3xl overflow-hidden aspect-video cursor-pointer group"
        onClick={() => setPlaying(true)}
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
            <svg className="w-7 h-7 text-sunrise-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold drop-shadow">
          Tap to play on YouTube
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden aspect-video">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
