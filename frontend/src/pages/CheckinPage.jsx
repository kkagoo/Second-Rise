import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Layer1Form from '../components/checkin/Layer1Form';
import Layer2BodyMap from '../components/checkin/Layer2BodyMap';
import AnimatedTransition from '../components/ui/AnimatedTransition';

export default function CheckinPage() {
  const [layer, setLayer] = useState(1);
  const [layer1Data, setLayer1Data] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  const navigate = useNavigate();

  function handleLayer1Complete(data) {
    setLayer1Data(data);
    if (data.painFlag) {
      setLayer(2);
    } else {
      submitCheckin(data, { body_map_flags: [], secondary_flags: {} });
    }
  }

  async function handleLayer2Complete({ body_map_flags, secondary_flags }) {
    submitCheckin(layer1Data, { body_map_flags, secondary_flags });
  }

  async function submitCheckin(l1, l2) {
    setSubmitting(true);
    setError('');
    try {
      await client.post('/checkin', {
        layer1_energy:     l1.energy,
        layer1_time_avail: l1.time,
        pain_flagged:      l1.painFlag,
        body_map_flags:    l2.body_map_flags,
        secondary_flags:   l2.secondary_flags,
      });
      navigate('/recommend');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
            Daily check-in
          </p>
          <h1 className="text-2xl font-bold text-earth-900">
            {layer === 1 ? "How are you today?" : "Tell me more"}
          </h1>
        </div>

        {submitting ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-sunrise-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-earth-500 text-sm">Building your workout…</p>
          </div>
        ) : (
          <AnimatedTransition keyProp={layer}>
            {layer === 1 ? (
              <Layer1Form onComplete={handleLayer1Complete} />
            ) : (
              <Layer2BodyMap
                energy={layer1Data?.energy}
                hasPelvicHistory={!!profile?.pelvic_floor_history}
                onComplete={handleLayer2Complete}
              />
            )}
          </AnimatedTransition>
        )}

        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}
