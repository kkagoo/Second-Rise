import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Layer1Form from '../components/checkin/Layer1Form';
import Layer2BodyMap from '../components/checkin/Layer2BodyMap';
import AnimatedTransition from '../components/ui/AnimatedTransition';

const LOADING_MESSAGES = [
  'Reading your check-in…',
  'Reviewing your body map…',
  'Claude is designing your session…',
  'Selecting exercises for today…',
  'Writing your form cues…',
  'Almost ready…',
];

export default function CheckinPage() {
  const [layer, setLayer] = useState(1);
  const [layer1Data, setLayer1Data] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [rec, setRec] = useState(null);
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

    // Cycle through loading messages every 3s
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOADING_MESSAGES.length - 1);
      setLoadingMsg(msgIdx);
    }, 3000);

    try {
      // 1. Submit check-in
      await client.post('/checkin', {
        layer1_energy:     l1.energy,
        layer1_time_avail: l1.time,
        pain_flagged:      l1.painFlag,
        body_map_flags:    l2.body_map_flags,
        secondary_flags:   l2.secondary_flags,
      });

      // 2. Pre-fetch recommendation (the Claude call) while still on this page
      const res = await client.get('/recommend');
      clearInterval(msgTimer);

      // 3. Navigate and pass rec data so recommendation page shows instantly
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
          <p className="text-xs font-semibold text-earth-400 uppercase tracking-widest mb-1">
            Daily check-in
          </p>
          <h1 className="text-2xl font-bold text-earth-900">
            {layer === 1 ? 'How are you today?' : 'Tell me more'}
          </h1>
        </div>

        {submitting ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            {/* Animated logo/pulse */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-sunrise-100 flex items-center justify-center">
                <span className="text-3xl">🌅</span>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-sunrise-300 border-t-sunrise-500 animate-spin" />
            </div>

            {/* Cycling message */}
            <div className="text-center">
              <p className="text-earth-700 font-medium text-base">
                {LOADING_MESSAGES[loadingMsg]}
              </p>
              <p className="text-earth-400 text-sm mt-1">
                This takes about 10 seconds
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= loadingMsg ? 'bg-sunrise-500 w-4' : 'bg-earth-100 w-1.5'
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
