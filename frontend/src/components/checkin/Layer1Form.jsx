import React, { useState } from 'react';
import EmojiPicker from '../ui/EmojiPicker';
import Button from '../ui/Button';

const TIME_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '35+', label: '35+ min' },
];

export default function Layer1Form({ onComplete }) {
  const [energy, setEnergy]     = useState(null);
  const [time, setTime]         = useState(null);
  const [painFlag, setPainFlag] = useState(null);

  const canProceed = energy !== null && time !== null && painFlag !== null;

  return (
    <div className="flex flex-col gap-8">
      {/* Energy */}
      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-3">How's your energy?</h2>
        <EmojiPicker value={energy} onChange={setEnergy} />
      </section>

      {/* Time available */}
      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-3">How much time do you have?</h2>
        <div className="grid grid-cols-4 gap-2">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTime(t.value)}
              className={`rounded-xl py-3.5 text-sm font-medium tap-target border transition-all duration-150 ${
                time === t.value
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Pain check */}
      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-3">Any pain or discomfort?</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPainFlag(false)}
            className={`rounded-xl py-4 text-sm font-medium tap-target border transition-all duration-150 ${
              painFlag === false
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
            }`}
          >
            Feeling good
          </button>
          <button
            onClick={() => setPainFlag(true)}
            className={`rounded-xl py-4 text-sm font-medium tap-target border transition-all duration-150 ${
              painFlag === true
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
            }`}
          >
            Yes, let me note it
          </button>
        </div>
      </section>

      <Button onClick={() => canProceed && onComplete({ energy, time, painFlag })} disabled={!canProceed} className="w-full">
        {painFlag ? 'Continue' : 'Get my workout'}
      </Button>
    </div>
  );
}
