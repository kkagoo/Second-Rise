import React, { useState } from 'react';
import BodyMapSVG from './BodyMapSVG';
import Button from '../ui/Button';

const PAIN_TYPES   = ['Sharp', 'Stiffness', 'Weakness'];
const SEVERITIES   = ['mild', 'moderate', 'severe'];

export default function Layer2BodyMap({ energy, hasPelvicHistory, onComplete }) {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [regionDetails, setRegionDetails] = useState({}); // { region: { pain_type, severity } }

  // Secondary flags (shown when energy is low)
  const showSecondary = energy <= 40;
  const [secondary, setSecondary] = useState({
    sleep: false, stress: false, brain_fog: false,
    gi_bloating: false, hot_flashes: false, just_one_of_those_days: false,
  });
  const [pelvicSymptoms, setPelvicSymptoms] = useState(null);

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

  const allRegionsDetailled = selectedRegions.every(
    (r) => regionDetails[r]?.pain_type && regionDetails[r]?.severity
  );

  function handleSubmit() {
    const body_map_flags = selectedRegions.map((r) => ({
      region: r,
      pain_type: regionDetails[r]?.pain_type || 'Stiffness',
      severity: regionDetails[r]?.severity || 'mild',
    }));

    const secondary_flags = showSecondary
      ? { ...secondary, ...(hasPelvicHistory ? { pelvic_symptoms: pelvicSymptoms === 'yes' } : {}) }
      : {};

    onComplete({ body_map_flags, secondary_flags });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-earth-900 mb-1">Where does it hurt?</h2>
        <p className="text-sm text-earth-500 mb-4">Tap the regions that are bothering you today.</p>
        <BodyMapSVG selected={selectedRegions} onToggle={toggleRegion} />
      </div>

      {/* Per-region details */}
      {selectedRegions.map((region) => (
        <div key={region} className="bg-white rounded-2xl border border-earth-100 p-4">
          <h3 className="font-semibold text-earth-800 mb-3">{region}</h3>

          <p className="text-xs text-earth-500 mb-2">Pain type</p>
          <div className="flex gap-2 mb-3">
            {PAIN_TYPES.map((pt) => (
              <button
                key={pt}
                onClick={() => setDetail(region, 'pain_type', pt)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold border tap-target transition-colors duration-150 ${
                  regionDetails[region]?.pain_type === pt
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600'
                }`}
              >
                {pt}
              </button>
            ))}
          </div>

          <p className="text-xs text-earth-500 mb-2">Severity</p>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setDetail(region, 'severity', s)}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold border capitalize tap-target transition-colors duration-150 ${
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
      ))}

      {/* Secondary flags for low energy */}
      {showSecondary && (
        <div className="bg-white rounded-2xl border border-earth-100 p-4">
          <h3 className="font-semibold text-earth-800 mb-3">What's driving today's low energy?</h3>
          <p className="text-xs text-earth-500 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(secondary).map((key) => (
              <button
                key={key}
                onClick={() => toggleSecondary(key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border tap-target transition-colors duration-150 ${
                  secondary[key]
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600'
                }`}
              >
                {key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pelvic floor follow-up */}
      {hasPelvicHistory && (
        <div className="bg-white rounded-2xl border border-earth-100 p-4">
          <h3 className="font-semibold text-earth-800 mb-3">Pelvic floor symptoms today?</h3>
          <div className="flex gap-3">
            {['yes', 'no'].map((v) => (
              <button
                key={v}
                onClick={() => setPelvicSymptoms(v)}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold border tap-target transition-colors duration-150 capitalize ${
                  pelvicSymptoms === v
                    ? 'border-sunrise-500 bg-sunrise-50 text-sunrise-700'
                    : 'border-earth-100 bg-white text-earth-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={selectedRegions.length > 0 && !allRegionsDetailled}
        className="w-full"
      >
        {selectedRegions.length === 0 ? 'No regions selected — continue →' : 'Get my workout →'}
      </Button>
    </div>
  );
}
