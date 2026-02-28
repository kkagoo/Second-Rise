import React, { useState } from 'react';
import BodyMapSVG from './BodyMapSVG';

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
        <h2 className="text-base font-bold text-gray-900 mb-1">Where does it hurt?</h2>
        <p className="text-sm text-gray-400 mb-4">Tap the areas that are bothering you today.</p>
        <BodyMapSVG selected={selectedRegions} onToggle={toggleRegion} />
      </div>

      {/* Per-region detail cards — optional, shown when region selected */}
      {selectedRegions.map((region) => (
        <div key={region} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-sm">{region}</h3>

          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Pain type</p>
            <div className="flex gap-2">
              {PAIN_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setDetail(region, 'pain_type', pt)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border-2 tap-target transition-all duration-150 ${
                    regionDetails[region]?.pain_type === pt
                      ? 'bg-blue-400 border-blue-400 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Severity</p>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setDetail(region, 'severity', s)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border-2 tap-target transition-all duration-150 ${
                    regionDetails[region]?.severity === s
                      ? 'bg-blue-400 border-blue-400 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
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
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">What's behind the low energy?</h3>
          <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSecondary(key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border-2 tap-target transition-all duration-150 ${
                  secondary[key]
                    ? 'bg-blue-400 border-blue-400 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold rounded-2xl py-4 transition-colors tap-target"
      >
        {selectedRegions.length === 0 ? 'No pain today — get my workout' : 'Get my workout →'}
      </button>
    </div>
  );
}
