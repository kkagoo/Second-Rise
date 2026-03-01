import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';

function VideoThumb({ youtubeId, title }) {
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 relative">
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#4BA3E3">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationPage() {
  const location = useLocation();
  const [rec, setRec]         = useState(location.state?.rec || null);
  const [loading, setLoading] = useState(!location.state?.rec);
  const [error, setError]     = useState('');
  const navigate              = useNavigate();

  useEffect(() => {
    if (location.state?.rec) return;
    client.get('/recommend')
      .then((res) => setRec(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load recommendation.'))
      .finally(() => setLoading(false));
  }, []);

  const video = rec?.primary_workout;

  const alternatives = rec ? [
    rec.alt_1_type && { id: rec.alt_1_type, title: rec.alt_1_title, creator: rec.alt_1_creator, youtube_id: rec.alt_1_youtube_id, duration_min: rec.alt_1_duration_min, reasoning: rec.alt_1_reasoning },
    rec.alt_2_type && { id: rec.alt_2_type, title: rec.alt_2_title, creator: rec.alt_2_creator, youtube_id: rec.alt_2_youtube_id, duration_min: rec.alt_2_duration_min, reasoning: rec.alt_2_reasoning },
    rec.alt_3_type && { id: rec.alt_3_type, title: rec.alt_3_title, creator: rec.alt_3_creator, youtube_id: rec.alt_3_youtube_id, duration_min: rec.alt_3_duration_min, reasoning: rec.alt_3_reasoning },
  ].filter(Boolean) : [];

  async function handleStart(selectedVideo) {
    await client.post('/recommend/select', { rec_id: rec.rec_id, session_type: selectedVideo.id || selectedVideo.session_type });
    navigate('/session', { state: { rec, video: selectedVideo, session_type: selectedVideo.session_type } });
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center tap-target"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Today's plan</p>
          <h1 className="text-xl font-bold text-gray-900">Your workout</h1>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Building your session…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {rec && video && !loading && (
          <>
            {/* Primary card */}
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <VideoThumb youtubeId={video.youtube_id} title={video.title} />

              <div className="p-4 flex flex-col gap-3">
                {/* Tags */}
                <div className="flex items-center gap-2">
                  <span className="bg-sky-card text-blue-500 text-xs font-semibold rounded-full px-3 py-1">
                    {video.duration_min} min
                  </span>
                  <span className="bg-orange-50 text-orange-400 text-xs font-semibold rounded-full px-3 py-1">
                    Recommended
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">{video.creator}</p>
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{video.title}</h2>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed">{rec.primary_reasoning}</p>

                {video.weight_note && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3">
                    <p className="text-xs font-bold text-orange-500 mb-1">Before you press play</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{video.weight_note}</p>
                  </div>
                )}

                <button
                  onClick={() => handleStart(video)}
                  className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 transition-colors"
                >
                  Start Session ▶
                </button>
              </div>
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-3">Or choose something different:</p>
                <div className="flex flex-col gap-3">
                  {alternatives.map((alt) => alt && (
                    <div key={alt.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex gap-3">
                        {alt.youtube_id && (
                          <div className="w-20 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={`https://img.youtube.com/vi/${alt.youtube_id}/default.jpg`}
                              alt={alt.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 mb-0.5">{alt.creator}</p>
                          <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{alt.title}</p>
                          <p className="text-xs text-gray-400 leading-relaxed mb-2">{alt.reasoning}</p>
                          <button
                            onClick={() => handleStart(alt)}
                            className="text-blue-400 text-xs font-semibold tap-target"
                          >
                            Choose this →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={() => navigate('/checkin')}
                className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 tap-target transition-colors"
              >
                Redo check-in
              </button>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-300 hover:text-gray-500 tap-target transition-colors"
              >
                Skip today
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
