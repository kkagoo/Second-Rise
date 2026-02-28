import React from 'react';

// Map exercise name keywords to a category
function getCategory(name = '') {
  const n = name.toLowerCase();
  if (/squat|lunge|deadlift|glute|hamstring|quad|calf|step|leg|hip hinge|hip circle|bridge|clamshell/.test(n))
    return 'lower';
  if (/plank|crunch|sit.?up|dead.?bug|bird.?dog|core|ab|oblique|hollow/.test(n))
    return 'core';
  if (/push.?up|press|row|pull|chest|shoulder|tricep|bicep|curl|lat|fly|dip|chin|band pull/.test(n))
    return 'upper';
  if (/stretch|child|pigeon|cobra|cat|cow|thread|figure|hip flexor|spinal|twist|prayer|roll|fold/.test(n))
    return 'stretch';
  if (/breath|diaphragm|inhale|exhale/.test(n))
    return 'breath';
  if (/balance|single.?leg|stand|yoga|warrior|tree|mountain/.test(n))
    return 'balance';
  return 'full';
}

const CATEGORIES = {
  lower: {
    emoji: '🦵',
    label: 'Lower body',
    bg: 'from-green-50 to-emerald-50',
    ring: 'border-green-200',
    text: 'text-green-700',
    muscles: ['Glutes', 'Quads', 'Hamstrings'],
  },
  upper: {
    emoji: '💪',
    label: 'Upper body',
    bg: 'from-blue-50 to-sky-50',
    ring: 'border-blue-200',
    text: 'text-blue-700',
    muscles: ['Shoulders', 'Back', 'Arms'],
  },
  core: {
    emoji: '🎯',
    label: 'Core',
    bg: 'from-orange-50 to-amber-50',
    ring: 'border-orange-200',
    text: 'text-orange-700',
    muscles: ['Abs', 'Obliques', 'Deep core'],
  },
  stretch: {
    emoji: '🧘',
    label: 'Mobility',
    bg: 'from-purple-50 to-violet-50',
    ring: 'border-purple-200',
    text: 'text-purple-700',
    muscles: ['Flexibility', 'Range of motion'],
  },
  balance: {
    emoji: '⚖️',
    label: 'Balance',
    bg: 'from-teal-50 to-cyan-50',
    ring: 'border-teal-200',
    text: 'text-teal-700',
    muscles: ['Stability', 'Coordination'],
  },
  breath: {
    emoji: '🌬️',
    label: 'Breathing',
    bg: 'from-sky-50 to-blue-50',
    ring: 'border-sky-200',
    text: 'text-sky-700',
    muscles: ['Diaphragm', 'Relaxation'],
  },
  full: {
    emoji: '⚡',
    label: 'Full body',
    bg: 'from-sunrise-50 to-amber-50',
    ring: 'border-sunrise-200',
    text: 'text-sunrise-700',
    muscles: ['Full body'],
  },
};

// Simple SVG stick figure poses per category
function FigureSVG({ category }) {
  const figures = {
    lower: (
      // Squat position
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
        <circle cx="40" cy="12" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="40" y1="21" x2="40" y2="50" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="32" x2="22" y2="44" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="32" x2="58" y2="44" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="50" x2="28" y2="68" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="50" x2="52" y2="68" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="28" y1="68" x2="22" y2="88" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="52" y1="68" x2="58" y2="88" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    upper: (
      // Row position
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
        <circle cx="40" cy="14" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="40" y1="23" x2="40" y2="58" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="34" x2="18" y2="52" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="34" x2="62" y2="52" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="58" x2="35" y2="82" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="58" x2="45" y2="82" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    ),
    core: (
      // Dead bug / supine position
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
        <circle cx="14" cy="40" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="23" y1="40" x2="70" y2="40" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="45" y1="40" x2="35" y2="22" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="45" y1="40" x2="35" y2="58" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="40" x2="82" y2="25" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="70" y1="40" x2="82" y2="55" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="82" y1="25" x2="90" y2="18" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="82" y1="55" x2="90" y2="62" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    stretch: (
      // Seated stretch
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
        <circle cx="40" cy="12" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="40" y1="21" x2="40" y2="55" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="35" x2="20" y2="28" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="35" x2="60" y2="28" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="20" y2="72" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="60" y2="72" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="20" y1="72" x2="20" y2="88" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="60" y1="72" x2="60" y2="88" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    balance: (
      // Single leg stand
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
        <circle cx="40" cy="10" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="40" y1="19" x2="40" y2="55" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="30" x2="22" y2="46" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="30" x2="58" y2="46" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="55" x2="40" y2="88" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="70" x2="55" y2="82" stroke="#9a7348" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    breath: (
      // Seated calm
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
        <circle cx="40" cy="20" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="40" y1="29" x2="40" y2="62" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="38" x2="18" y2="50" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="38" x2="62" y2="50" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="62" x2="22" y2="78" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="62" x2="58" y2="78" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <ellipse cx="40" cy="42" rx="18" ry="8" stroke="#9a7348" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"/>
      </svg>
    ),
    full: (
      // Standing
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none">
        <circle cx="40" cy="10" r="9" fill="#9a7348" opacity="0.7"/>
        <line x1="40" y1="19" x2="40" y2="58" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="30" x2="20" y2="50" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="30" x2="60" y2="50" stroke="#9a7348" strokeWidth="3" strokeLinecap="round"/>
        <line x1="40" y1="58" x2="32" y2="82" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="40" y1="58" x2="48" y2="82" stroke="#9a7348" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    ),
  };

  return figures[category] || figures.full;
}

export default function ExerciseIllustration({ name }) {
  const cat = getCategory(name);
  const info = CATEGORIES[cat];

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${info.bg} border ${info.ring} p-4 flex items-center gap-4`}>
      {/* Stick figure */}
      <div className="w-16 h-20 flex-shrink-0 opacity-80">
        <FigureSVG category={cat} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{info.emoji}</span>
          <span className={`text-xs font-bold uppercase tracking-widest ${info.text}`}>
            {info.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {info.muscles.map((m) => (
            <span
              key={m}
              className={`text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-70 ${info.text} font-medium`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
