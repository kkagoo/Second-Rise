import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/session/VideoPlayer';

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

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rec, video, session_type } = location.state || {};
  const [showConfirm, setShowConfirm] = useState(false);

  if (!video) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No session data found.</p>
          <button
            onClick={() => navigate('/recommend')}
            className="bg-blue-400 text-white font-semibold rounded-2xl px-6 py-3"
          >
            Back to recommendation
          </button>
        </div>
      </div>
    );
  }

  const recId = rec?.rec_id ?? null;

  // Bottom sheet that appears when user taps "I'm done"
  if (showConfirm) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Dimmed top area */}
        <div
          className="flex-1 bg-black/20"
          onClick={() => setShowConfirm(false)}
        />

        {/* Bottom sheet */}
        <div className="bg-white rounded-t-3xl px-5 pt-6 pb-10 safe-bottom">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

          <h2 className="text-xl font-bold text-gray-900 mb-1">Nice work!</h2>
          <p className="text-gray-400 text-sm mb-6">How did that session go?</p>

          <div className="flex flex-col gap-3">
            {recId ? (
              <>
                <button
                  onClick={() => navigate('/feedback', { state: { rec_id: recId } })}
                  className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-2xl py-4 transition-colors tap-target"
                >
                  Rate this session →
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 tap-target transition-colors py-2"
                >
                  Done — skip rating
                </button>
              </>
            ) : (
              /* Library session — no rec_id, can't submit feedback */
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-2xl py-4 transition-colors tap-target"
              >
                Back to home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center tap-target flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest truncate">
            {TYPE_LABEL[video.session_type] || video.session_type?.replace(/_/g, ' ')}
          </p>
          <p className="text-sm font-semibold text-gray-600 truncate">{video.creator}</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Video */}
        <VideoPlayer youtubeId={video.youtube_id} title={video.title} />

        {/* Title + meta */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{video.title}</h1>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 rounded-full px-3 py-1">
              {video.duration_min} min
            </span>
            {video.session_type && (
              <span className={`text-xs font-semibold rounded-full px-3 py-1 ${TYPE_COLOR[video.session_type] || 'bg-gray-100 text-gray-600'}`}>
                {TYPE_LABEL[video.session_type] || video.session_type}
              </span>
            )}
            {video.intensity && (
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                {video.intensity} intensity
              </span>
            )}
            {video.equipment && video.equipment !== 'none' && (
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 rounded-full px-3 py-1">
                {video.equipment}
              </span>
            )}
          </div>
        </div>

        {/* Before you press play */}
        {video.weight_note && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Before you press play</p>
            <p className="text-gray-700 text-sm leading-relaxed">{video.weight_note}</p>
          </div>
        )}

        {/* Completion CTA */}
        <div className="mt-2 flex flex-col gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-2xl py-4 transition-colors tap-target"
          >
            I finished this workout ✓
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-center text-sm text-gray-300 hover:text-gray-500 tap-target transition-colors"
          >
            Exit without marking complete
          </button>
        </div>
      </div>
    </div>
  );
}
