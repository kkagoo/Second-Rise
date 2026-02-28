import React, { useState } from 'react';

const REGIONS = [
  // Front
  { id: 'Neck',            view: 'front', label: 'Neck',           cx: 100, cy: 68 },
  { id: 'Shoulders',       view: 'both',  label: 'Shoulders',      cx: 100, cy: 95 },
  { id: 'Core/Abdominal',  view: 'front', label: 'Core',           cx: 100, cy: 145 },
  { id: 'Hips',            view: 'both',  label: 'Hips',           cx: 100, cy: 185 },
  { id: 'Knees',           view: 'both',  label: 'Knees',          cx: 100, cy: 255 },
  { id: 'Wrists/Hands',    view: 'front', label: 'Wrists',         cx: 45,  cy: 195 },
  { id: 'Feet/Ankles',     view: 'both',  label: 'Feet',           cx: 100, cy: 315 },
  // Back
  { id: 'Upper Back',      view: 'back',  label: 'Upper Back',     cx: 100, cy: 110 },
  { id: 'Low Back',        view: 'back',  label: 'Low Back',       cx: 100, cy: 160 },
];

export default function BodyMapSVG({ selected, onToggle }) {
  const [view, setView] = useState('front');

  const visible = REGIONS.filter((r) => r.view === view || r.view === 'both');

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Toggle */}
      <div className="flex rounded-full border-2 border-earth-200 overflow-hidden">
        {['front', 'back'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-6 py-2 text-sm font-semibold capitalize transition-colors duration-150 tap-target ${
              view === v ? 'bg-sunrise-500 text-white' : 'bg-white text-earth-600'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* SVG silhouette */}
      <svg
        viewBox="0 0 200 350"
        className="w-48 h-auto"
        style={{ maxHeight: 320 }}
      >
        {/* Simple body outline */}
        {view === 'front' ? (
          <g fill="#f0e8d8" stroke="#c9b082" strokeWidth="1.5">
            {/* Head */}
            <ellipse cx="100" cy="40" rx="22" ry="26" />
            {/* Torso */}
            <rect x="72" y="80" width="56" height="100" rx="10" />
            {/* Left arm */}
            <rect x="42" y="82" width="28" height="90" rx="8" />
            {/* Right arm */}
            <rect x="130" y="82" width="28" height="90" rx="8" />
            {/* Left leg */}
            <rect x="72" y="182" width="26" height="130" rx="8" />
            {/* Right leg */}
            <rect x="102" y="182" width="26" height="130" rx="8" />
          </g>
        ) : (
          <g fill="#f0e8d8" stroke="#c9b082" strokeWidth="1.5">
            <ellipse cx="100" cy="40" rx="22" ry="26" />
            <rect x="72" y="80" width="56" height="100" rx="10" />
            <rect x="42" y="82" width="28" height="90" rx="8" />
            <rect x="130" y="82" width="28" height="90" rx="8" />
            <rect x="72" y="182" width="26" height="130" rx="8" />
            <rect x="102" y="182" width="26" height="130" rx="8" />
          </g>
        )}

        {/* Tap targets */}
        {visible.map((region) => {
          const isSelected = selected.includes(region.id);
          return (
            <g key={region.id} onClick={() => onToggle(region.id)} style={{ cursor: 'pointer' }}>
              <circle
                cx={region.cx}
                cy={region.cy}
                r="20"
                fill={isSelected ? '#f0722e' : 'rgba(240,114,46,0.15)'}
                stroke={isSelected ? '#e0521a' : '#f0722e'}
                strokeWidth="1.5"
                opacity={isSelected ? 0.9 : 0.7}
              />
              <text
                x={region.cx}
                y={region.cy + 4}
                textAnchor="middle"
                fontSize="7"
                fill={isSelected ? '#fff' : '#762b16'}
                fontWeight="600"
                style={{ pointerEvents: 'none', fontFamily: 'DM Sans, sans-serif' }}
              >
                {region.label}
              </text>
            </g>
          );
        })}
      </svg>

      {selected.length > 0 && (
        <p className="text-xs text-earth-500 text-center">
          Tap a region again to deselect
        </p>
      )}
    </div>
  );
}
