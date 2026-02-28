import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/session/VideoPlayer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const INTENSITY_COLOR = {
  low:    'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high:   'bg-red-50 text-red-700 border-red-200',
};

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rec, video, session_type } = location.state || {};

  // Support both old exercise-based and new video-based sessions
  const isVideo = video?.type === 'video' || video?.youtube_id;

  if (!video && !rec) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-earth-500 mb-4">No session data found.</p>
          <Button onClick={() => navigate('/recommend')}>Back to recommendation</Button>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="min-h-screen bg-cream px-5 pt-10 pb-8 safe-bottom">
        <div className="max-w-md mx-auto flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest">
                {video.session_type?.replace(/_/g, ' ')}
              </p>
              <p className="text-sm font-semibold text-earth-600">{video.creator}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-earth-400 underline tap-target"
            >
              Done
            </button>
          </div>

          {/* Video player */}
          <VideoPlayer youtubeId={video.youtube_id} title={video.title} />

          {/* Title + meta */}
          <div>
            <h1 className="text-xl font-bold text-earth-900 mb-2">{video.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-semibold bg-earth-100 text-earth-600 rounded-full px-3 py-1">
                {video.duration_min} min
              </span>
              {video.intensity && (
                <span className={`text-xs font-semibold rounded-full px-3 py-1 border ${INTENSITY_COLOR[video.intensity] || 'bg-earth-100 text-earth-600'}`}>
                  {video.intensity} intensity
                </span>
              )}
              {video.equipment && video.equipment !== 'none' && (
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                  {video.equipment}
                </span>
              )}
            </div>
          </div>

          {/* Weight note */}
          {video.weight_note && (
            <Card className="border-sunrise-200 bg-sunrise-50">
              <p className="text-xs font-bold text-sunrise-700 uppercase tracking-widest mb-1">
                Before you press play
              </p>
              <p className="text-earth-700 text-sm leading-relaxed">{video.weight_note}</p>
            </Card>
          )}

          {/* Done → feedback */}
          <Button
            className="w-full"
            onClick={() => navigate('/feedback', { state: { rec_id: rec?.rec_id } })}
          >
            Finished — rate this session
          </Button>
          <button
            onClick={() => navigate('/')}
            className="text-center text-sm text-earth-400 underline tap-target"
          >
            Skip rating
          </button>
        </div>
      </div>
    );
  }

  // Fallback — should not be reached in normal flow
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-earth-500 mb-4">Session format not recognised.</p>
        <Button onClick={() => navigate('/')}>Go home</Button>
      </div>
    </div>
  );
}
