import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Layer1Form from '../components/checkin/Layer1Form';
import Layer2BodyMap from '../components/checkin/Layer2BodyMap';
import AnimatedTransition from '../components/ui/AnimatedTransition';

const LOADING_MESSAGES = [
  'Reading your check-in…',
  'Reviewing your symptoms…',
  'Building your session…',
  'Picking the right workout…',
  'Almost ready…',
];

export default function CheckinPage() {
  const [layer, setLayer] = useState(1);
  const [layer1Data, setLayer1Data] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');
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
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOADING_MESSAGES.length - 1);
      setLoadingMsg(msgIdx);
    }, 3000);

    try {
      await client.post('/checkin', {
        layer1_energy:     l1.energy,
        layer1_time_avail: l1.time,
        pain_flagged:      l1.painFlag,
        body_map_flags:    l2.body_map_flags,
        secondary_flags:   l2.secondary_flags,
      });
      const res = await client.get('/recommend');
      clearInterval(msgTimer);
      navigate('/recommend', { state: { rec: res.data } });
    } catch (err) {
      clearInterval(msgTimer);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
      setLoadingMsg(0);
    }
  }

  return (
    <div className="min-h-screen bg-cream px-5 pt-12 pb-8 safe-bottom">
      <div className="max-w-md mx-auto">

        <div className="mb-8">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
            Daily check-in
          </p>
          <h1 className="text-xl font-semibold text-stone-900">
            {layer === 1 ? 'How are you today?' : 'Tell us more'}
          </h1>
        </div>

        {submitting ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-700 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-stone-700 font-medium text-sm">
                {LOADING_MESSAGES[loadingMsg]}
              </p>
              <p className="text-stone-400 text-xs mt-1">About 10 seconds</p>
            </div>
            <div className="flex gap-1.5">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= loadingMsg ? 'bg-stone-700 w-5' : 'bg-stone-200 w-1.5'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <AnimatedTransition keyProp={layer}>
            {layer === 1 ? (
              <Layer1Form onComplete={handleLayer1Complete} />
            ) : (
              <Layer2BodyMap
                energy={layer1Data?.energy}
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
