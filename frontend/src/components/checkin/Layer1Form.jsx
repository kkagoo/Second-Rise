import React, { useState } from 'react';
import EmojiPicker from '../ui/EmojiPicker';
import Button from '../ui/Button';

const TIME_OPTIONS = ['15', '20', '30', '35+'];

export default function Layer1Form({ onComplete }) {
  const [energy, setEnergy]     = useState(null);
  const [time, setTime]         = useState(null);
  const [painFlag, setPainFlag] = useState(null); // null | true | false

  const canProceed = energy !== null && time !== null && painFlag !== null;

  function handleSubmit() {
    if (!canProceed) return;
    onComplete({ energy, time, painFlag });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Energy */}
      <section>
        <h2 className="text-lg font-semibold text-earth-900 mb-3">How's your energy today?</h2>
        <EmojiPicker value={energy} onChange={setEnergy} />
      </section>

      {/* Time available */}
      <section>
        <h2 className="text-lg font-semibold text-earth-900 mb-3">How much time do you have?</h2>
        <div className="grid grid-cols-4 gap-3">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-2xl py-4 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
                time === t
                  ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                  : 'border-earth-100 bg-white text-earth-600 hover:border-sunrise-200'
              }`}
            >
              {t === '35+' ? '35+ min' : `${t} min`}
            </button>
          ))}
        </div>
      </section>

      {/* Pain check */}
      <section>
        <h2 className="text-lg font-semibold text-earth-900 mb-3">Any pain or discomfort?</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPainFlag(false)}
            className={`rounded-2xl py-4 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
              painFlag === false
                ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                : 'border-earth-100 bg-white text-earth-600 hover:border-sunrise-200'
            }`}
          >
            I'm good 👍
          </button>
          <button
            onClick={() => setPainFlag(true)}
            className={`rounded-2xl py-4 text-sm font-semibold tap-target border-2 transition-all duration-150 ${
              painFlag === true
                ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                : 'border-earth-100 bg-white text-earth-600 hover:border-sunrise-200'
            }`}
          >
            Yes, let me note it 📍
          </button>
        </div>
      </section>

      <Button onClick={handleSubmit} disabled={!canProceed} className="w-full">
        {painFlag ? 'Continue to body map →' : 'Get my workout →'}
      </Button>
    </div>
  );
}
