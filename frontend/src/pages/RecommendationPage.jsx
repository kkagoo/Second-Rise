import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function VideoThumb({ youtubeId, title, small }) {
  return (
    <div className={`rounded-2xl overflow-hidden bg-earth-100 ${small ? 'aspect-video' : 'aspect-video'}`}>
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
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
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">Today's plan</p>
          <h1 className="text-2xl font-bold text-earth-900">Your workout</h1>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-sunrise-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-earth-500 text-sm">Claude is picking your session…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
        )}

        {rec && video && !loading && (
          <>
            {/* Primary recommendation */}
            <Card className="border-2 border-sunrise-200 gap-4 flex flex-col">
              <div className="flex items-center justify-between">
                <Badge color="sunrise">Recommended for today</Badge>
                <span className="text-xs text-earth-400">{video.duration_min} min</span>
              </div>

              <VideoThumb youtubeId={video.youtube_id} title={video.title} />

              <div>
                <p className="text-xs font-semibold text-earth-400 mb-0.5">{video.creator}</p>
                <h2 className="text-lg font-bold text-earth-900">{video.title}</h2>
              </div>

              <p className="text-earth-600 text-sm leading-relaxed">{rec.primary_reasoning}</p>

              {video.weight_note && (
                <div className="bg-sunrise-50 border border-sunrise-200 rounded-2xl p-3">
                  <p className="text-xs font-bold text-sunrise-700 mb-1">Before you press play</p>
                  <p className="text-sm text-earth-700 leading-relaxed">{video.weight_note}</p>
                </div>
              )}

              <Button onClick={() => handleStart(video)} className="w-full">
                Start Session ▶
              </Button>
            </Card>

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-earth-500 mb-3">Or choose something different:</p>
                <div className="flex flex-col gap-3">
                  {alternatives.map((alt) => alt && (
                    <Card key={alt.id}>
                      <div className="flex gap-3">
                        {alt.youtube_id && (
                          <div className="w-24 flex-shrink-0 rounded-xl overflow-hidden">
                            <VideoThumb youtubeId={alt.youtube_id} title={alt.title} small />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-earth-400 mb-0.5">{alt.creator}</p>
                          <p className="font-semibold text-earth-800 text-sm leading-tight mb-1">{alt.title}</p>
                          <p className="text-xs text-earth-500 leading-relaxed mb-2">{alt.reasoning}</p>
                          <button
                            onClick={() => handleStart(alt)}
                            className="text-sunrise-600 text-xs font-semibold underline tap-target"
                          >
                            Choose this →
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => navigate('/checkin')}
                className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2 tap-target transition-colors"
              >
                Redo check-in
              </button>
              <button onClick={() => navigate('/')} className="text-sm text-stone-400 hover:text-stone-600 tap-target transition-colors">
                Skip today
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
