import React, { useState } from 'react';
import BodyMapSVG from './BodyMapSVG';
import Button from '../ui/Button';

const PAIN_TYPES = ['Sharp', 'Stiffness', 'Weakness'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

const SECONDARY_OPTIONS = [
  { key: 'sleep',                  label: 'Poor sleep' },
  { key: 'stress',                 label: 'Stress' },
  { key: 'brain_fog',              label: 'Brain fog' },
  { key: 'gi_bloating',            label: 'Bloating' },
  { key: 'hot_flashes',            label: 'Hot flashes' },
  { key: 'just_one_of_those_days', label: 'Just one of those days' },
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

  function setDetail(region, key, val) {
    setRegionDetails((prev) => ({
      ...prev,
      [region]: { ...(prev[region] || {}), [key]: val },
    }));
  }

  function toggleSecondary(key) {
    setSecondary((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const allDetailed = selectedRegions.every(
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
        <h2 className="text-base font-semibold text-stone-900 mb-1">Where does it hurt?</h2>
        <p className="text-sm text-stone-500 mb-4">Tap the areas that are bothering you today.</p>
        <BodyMapSVG selected={selectedRegions} onToggle={toggleRegion} />
      </div>

      {/* Per-region detail cards */}
      {selectedRegions.map((region) => (
        <div key={region} className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-4">
          <h3 className="font-semibold text-stone-900 text-sm">{region}</h3>

          <div>
            <p className="text-xs text-stone-400 mb-2 uppercase tracking-widest">Pain type</p>
            <div className="flex gap-2">
              {PAIN_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setDetail(region, 'pain_type', pt)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium border tap-target transition-all duration-150 ${
                    regionDetails[region]?.pain_type === pt
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-stone-400 mb-2 uppercase tracking-widest">Severity</p>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setDetail(region, 'severity', s)}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium border tap-target transition-all duration-150 ${
                    regionDetails[region]?.severity === s
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Secondary flags for low energy */}
      {showSecondary && (
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <h3 className="font-semibold text-stone-900 text-sm mb-1">What's behind the low energy?</h3>
          <p className="text-xs text-stone-400 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSecondary(key)}
                className={`rounded-full px-4 py-2 text-xs font-medium border tap-target transition-all duration-150 ${
                  secondary[key]
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={selectedRegions.length > 0 && !allDetailed}
        className="w-full"
      >
        {selectedRegions.length === 0 ? 'No pain today — get my workout' : 'Get my workout'}
      </Button>
    </div>
  );
}
