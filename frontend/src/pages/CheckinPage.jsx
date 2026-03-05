import React, { useState, useEffect } from 'react';
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

const ENERGY_LABELS = { 20: 'Low energy', 40: 'Medium-low energy', 65: 'Medium energy', 85: 'High energy' };

export default function CheckinPage() {
  const [layer, setLayer] = useState(1);
  const [layer1Data, setLayer1Data] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');
  const [biometrics, setBiometrics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/biometrics/today')
      .then((r) => { if (r.data?.source) setBiometrics(r.data); })
      .catch(() => {});
  }, []);

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
    <div className="min-h-screen bg-white px-5 pt-14 pb-28">
      <div className="max-w-md mx-auto">

        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
            Daily check-in
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {layer === 1 ? 'How are you today?' : 'Tell us more'}
          </h1>
        </div>

        {submitting ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-400 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-gray-700 font-medium text-sm">
                {LOADING_MESSAGES[loadingMsg]}
              </p>
              <p className="text-gray-400 text-xs mt-1">About 10 seconds</p>
            </div>
            <div className="flex gap-1.5">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= loadingMsg ? 'bg-blue-400 w-5' : 'bg-gray-200 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <AnimatedTransition keyProp={layer}>
            {layer === 1 ? (
              <>
                {biometrics && (
                  <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex flex-col gap-1">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                      {biometrics.source === 'oura' ? 'Oura' : 'Apple Health'} today
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {biometrics.readiness_score != null ? `Readiness ${biometrics.readiness_score}` : ''}
                      {biometrics.total_sleep_min != null
                        ? `${biometrics.readiness_score != null ? ' · ' : ''}Sleep ${Math.floor(biometrics.total_sleep_min / 60)}h ${biometrics.total_sleep_min % 60}m`
                        : ''}
                    </p>
                    <p className="text-xs text-blue-400">
                      Suggesting: {ENERGY_LABELS[biometrics.energy_suggestion] ?? 'Medium energy'} · tap to apply, or choose your own
                    </p>
                  </div>
                )}
                <Layer1Form
                  onComplete={handleLayer1Complete}
                  suggestion={biometrics?.energy_suggestion}
                  tempFlag={biometrics?.temp_flag}
                />
              </>
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
