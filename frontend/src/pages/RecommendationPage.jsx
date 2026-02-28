import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import PrimaryCard from '../components/recommendation/PrimaryCard';
import AlternativeCard from '../components/recommendation/AlternativeCard';

export default function RecommendationPage() {
  const [rec, setRec]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [altLoading, setAltLoading] = useState(null);
  const [error, setError]     = useState('');
  const navigate              = useNavigate();

  useEffect(() => {
    client.get('/recommend')
      .then((res) => setRec(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load recommendation.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleStartPrimary() {
    await client.post('/recommend/select', { rec_id: rec.rec_id, session_type: rec.primary_session_type });
    navigate('/session', { state: { rec, workout: rec.primary_workout, session_type: rec.primary_session_type } });
  }

  async function handleSelectAlt(session_type) {
    setAltLoading(session_type);
    try {
      const res = await client.post('/recommend/alt', { rec_id: rec.rec_id, session_type });
      await client.post('/recommend/select', { rec_id: rec.rec_id, session_type });
      navigate('/session', {
        state: { rec, workout: res.data.workout, session_type },
      });
    } catch (err) {
      setError('Could not load alternative workout. Please try again.');
    } finally {
      setAltLoading(null);
    }
  }

  const alternatives = rec ? [
    rec.alt_1_type && { session_type: rec.alt_1_type, reasoning: rec.alt_1_reasoning },
    rec.alt_2_type && { session_type: rec.alt_2_type, reasoning: rec.alt_2_reasoning },
    rec.alt_3_type && { session_type: rec.alt_3_type, reasoning: rec.alt_3_reasoning },
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
            Today's plan
          </p>
          <h1 className="text-2xl font-bold text-earth-900">Your workout</h1>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-sunrise-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-earth-500 text-sm">Claude is designing your session…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {rec && !loading && (
          <div className="flex flex-col gap-5">
            <PrimaryCard rec={rec} onStart={handleStartPrimary} />

            {alternatives.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-earth-500 mb-3">Or choose something different:</p>
                <div className="flex flex-col gap-3">
                  {alternatives.map((alt) => (
                    <AlternativeCard
                      key={alt.session_type}
                      session_type={alt.session_type}
                      reasoning={alt.reasoning}
                      onSelect={() => handleSelectAlt(alt.session_type)}
                      loading={altLoading === alt.session_type}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="text-center text-sm text-earth-400 underline tap-target py-2"
            >
              Skip today
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
