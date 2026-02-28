import React, { useState } from 'react';
import BodyMapSVG from './BodyMapSVG';
import Button from '../ui/Button';

const PAIN_TYPES = ['Sharp', 'Stiffness', 'Weakness'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

const SECONDARY_OPTIONS = [
  { key: 'sleep',       label: 'Poor sleep',      emoji: '😴' },
  { key: 'stress',      label: 'Stress',          emoji: '😤' },
  { key: 'brain_fog',   label: 'Brain fog',       emoji: '🌫️' },
  { key: 'gi_bloating', label: 'Bloating',        emoji: '🎈' },
  { key: 'hot_flashes', label: 'Hot flashes',     emoji: '🌡️' },
  { key: 'just_one_of_those_days', label: 'Just one of those days', emoji: '🤷' },
];

export default function Layer2BodyMap({ energy, onComplete }) {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [regionDetails, setRegionDetails] = useState({});
  const showSecondary = energy <= 40;
  const [secondary, setSecondary] = useState(
    Object.fromEntries(SECONDARY_OPTIONS.map((o) => [o.key, false]))
  );

  function toggleRegion(region) {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  function setDetail(region, key, value) {
    setRegionDetails((prev) => ({
      ...prev,
      [region]: { ...(prev[region] || {}), [key]: value },
    }));
  }

  function toggleSecondary(key) {
    setSecondary((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const allRegionsDetailed = selectedRegions.every(
    (r) => regionDetails[r]?.pain_type && regionDetails[r]?.severity
  );

  function handleSubmit() {
    const body_map_flags = selectedRegions.map((r) => ({
      region: r,
      pain_type: regionDetails[r]?.pain_type || 'Stiffness',
      severity: (regionDetails[r]?.severity || 'Mild').toLowerCase(),
    }));
    onComplete({ body_map_flags, secondary_flags: showSecondary ? secondary : {} });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-earth-900 mb-1">Where does it hurt?</h2>
        <p className="text-sm text-earth-500 mb-4">Tap the areas that are bothering you today.</p>
        <BodyMapSVG selected={selectedRegions} onToggle={toggleRegion} />
      </div>

      {/* Per-region detail cards */}
      {selectedRegions.map((region) => (
        <div key={region} className="bg-white rounded-2xl border border-earth-100 p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-earth-800">{region}</h3>

          <div>
            <p className="text-xs text-earth-400 mb-2">What kind of pain?</p>
            <div className="flex gap-2">
              {PAIN_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setDetail(region, 'pain_type', pt)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border tap-target transition-colors duration-150 ${
                    regionDetails[region]?.pain_type === pt
                      ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                      : 'border-earth-100 bg-white text-earth-600'
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-earth-400 mb-2">How bad?</p>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setDetail(region, 'severity', s)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border tap-target transition-colors duration-150 ${
                    regionDetails[region]?.severity === s
                      ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                      : 'border-earth-100 bg-white text-earth-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Secondary flags — only shown for low energy */}
      {showSecondary && (
        <div className="bg-white rounded-2xl border border-earth-100 p-4">
          <h3 className="font-semibold text-earth-800 mb-1">What's driving the low energy?</h3>
          <p className="text-xs text-earth-400 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_OPTIONS.map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => toggleSecondary(key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold border tap-target transition-colors duration-150 ${
                  secondary[key]
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600'
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={selectedRegions.length > 0 && !allRegionsDetailed}
        className="w-full"
      >
        {selectedRegions.length === 0 ? 'No pain today — get my workout →' : 'Get my workout →'}
      </Button>
    </div>
  );
}
