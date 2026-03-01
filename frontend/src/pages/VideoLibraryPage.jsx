import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { RunIllustration, StrengthIllustration, YogaIllustration, DumbbellIllustration } from '../components/ui/Illustrations';

const CATEGORIES = [
  { id: null,               label: 'All',      color: 'bg-gray-900 text-white',     textInactive: 'text-gray-700' },
  { id: 'yoga',             label: 'Yoga',     color: 'bg-orange-400 text-white',   textInactive: 'text-gray-700' },
  { id: 'strength',         label: 'Strength', color: 'bg-blue-400 text-white',     textInactive: 'text-gray-700' },
  { id: 'low_impact_cardio',label: 'Cardio',   color: 'bg-orange-400 text-white',   textInactive: 'text-gray-700' },
  { id: 'mobility',         label: 'Mobility', color: 'bg-blue-400 text-white',     textInactive: 'text-gray-700' },
];

const CATEGORY_ILLUSTRATIONS = {
  yoga:              <YogaIllustration size={56} />,
  strength:          <StrengthIllustration size={56} />,
  low_impact_cardio: <RunIllustration size={56} />,
  mobility:          <DumbbellIllustration size={44} />,
};

const TYPE_LABEL = {
  yoga:              'Yoga',
  strength:          'Strength',
  low_impact_cardio: 'Cardio',
  mobility:          'Mobility',
};

const TYPE_COLOR = {
  yoga:              'bg-orange-50 text-orange-500',
  strength:          'bg-sky-card text-blue-500',
  low_impact_cardio: 'bg-orange-50 text-orange-500',
  mobility:          'bg-sky-card text-blue-500',
};

export default function VideoLibraryPage() {
  const location = useLocation();
  const [videos, setVideos]       = useState([]);
  const [filter, setFilter]       = useState(location.state?.type || null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const url = filter ? `/videos?type=${filter}` : '/videos';
    client.get(url)
      .then((res) => setVideos(res.data))
      .catch(() => setError('Could not load videos.'))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleSelect(video) {
    // Start a session directly from library — skip check-in
    try {
      // We post a recommend/select with null rec_id (library pick)
      navigate('/session', {
        state: {
          rec: null,
          video,
          session_type: video.session_type,
          fromLibrary: true,
        },
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Browse</p>
        <h1 className="text-2xl font-bold text-gray-900">Video library</h1>
        <p className="text-sm text-gray-400 mt-1">Pick any session to start right now.</p>
      </div>

      {/* Category filter pills */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map(({ id, label, color }) => {
            const active = filter === id;
            return (
              <button
                key={String(id)}
                onClick={() => setFilter(id)}
                className={`flex-shrink-0 text-sm font-semibold rounded-2xl px-5 py-2.5 tap-target transition-all border-2 ${
                  active
                    ? `${color} border-transparent`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category header card (when filtered) */}
      {filter && (
        <div className="mx-5 mb-5 bg-sky-card rounded-3xl p-5 flex items-center gap-4">
          <div className="flex-shrink-0">
            {CATEGORY_ILLUSTRATIONS[filter] || null}
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-0.5">Category</p>
            <h2 className="text-xl font-bold text-gray-900">{TYPE_LABEL[filter]}</h2>
            <p className="text-sm text-gray-500">{videos.length} videos</p>
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="px-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        ) : videos.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No videos found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleSelect(video)}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm text-left tap-target"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#4BA3E3">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                    {video.duration_min}m
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs text-gray-400 truncate mb-0.5">{video.creator}</p>
                  <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{video.title}</p>
                  <span className={`mt-1.5 inline-block text-xs font-semibold rounded-full px-2 py-0.5 ${TYPE_COLOR[video.session_type] || 'bg-gray-100 text-gray-500'}`}>
                    {TYPE_LABEL[video.session_type] || video.session_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
