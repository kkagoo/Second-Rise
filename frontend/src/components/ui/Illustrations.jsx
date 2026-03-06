import React from 'react';

/** Circular progress ring — shows a score out of 100 */
export function RecoveryRing({ score, size = 120, label = 'readiness' }) {
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score ?? 0)) / 100);
  const color = !score ? '#374151'
    : score < 40 ? '#F59E0B'
    : score < 80 ? '#5C7CFA'
    : '#34D399';
  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={size * 0.07} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.07}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={size * 0.22} fontWeight="700">
        {score ?? '—'}
      </text>
      <text x={cx} y={cy + size * 0.14} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={size * 0.1}>
        {label}
      </text>
    </svg>
  );
}

/** Semicircle arc showing sleep vs 9h target */
export function SleepArc({ totalMin, size = 80 }) {
  const target = 9 * 60;
  const pct = Math.min(1, (totalMin ?? 0) / target);
  const r = size * 0.4;
  const cx = size / 2, cy = size * 0.6;
  // Semicircle: start at left (180°), end at right (0°)
  const startAngle = Math.PI;
  const endAngle = startAngle - pct * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;
  return (
    <svg width={size} height={size * 0.65} aria-hidden="true">
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={size * 0.07} strokeLinecap="round"
      />
      {/* Arc */}
      {pct > 0 && (
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke="#5C7CFA" strokeWidth={size * 0.07} strokeLinecap="round"
        />
      )}
    </svg>
  );
}

import workingOut      from '../../assets/illustrations/working-out.svg';
import morningWorkout  from '../../assets/illustrations/morning-workout.svg';
import mindfulness     from '../../assets/illustrations/mindfulness.svg';
import personalTrainer from '../../assets/illustrations/personal-trainer.svg';
import yoga            from '../../assets/illustrations/yoga.svg';
import personalTraining from '../../assets/illustrations/personal-training.svg';
import avatar          from '../../assets/illustrations/avatar.svg';

function IllustrationImg({ src, size, alt = '' }) {
  return <img src={src} alt={alt} width={size} height={size} style={{ objectFit: 'contain' }} />;
}

export function WomanWorkoutIllustration({ size = 200 }) {
  return <IllustrationImg src={workingOut} size={size} alt="Woman working out" />;
}
export function YogaIllustration({ size = 56 }) {
  return <IllustrationImg src={yoga} size={size} alt="Yoga" />;
}
export function RunIllustration({ size = 56 }) {
  return <IllustrationImg src={morningWorkout} size={size} alt="Cardio" />;
}
export function StrengthIllustration({ size = 56 }) {
  return <IllustrationImg src={personalTraining} size={size} alt="Strength" />;
}
export function DumbbellIllustration({ size = 44 }) {
  return <IllustrationImg src={personalTrainer} size={size} alt="Mobility" />;
}
export function ProfileIllustration({ size = 120 }) {
  return <IllustrationImg src={avatar} size={size} alt="Profile" />;
}
export function EmptyStateIllustration({ size = 100 }) {
  return <IllustrationImg src={mindfulness} size={size} alt="No sessions yet" />;
}
