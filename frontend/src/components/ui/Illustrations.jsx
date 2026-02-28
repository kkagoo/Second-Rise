import React from 'react';

/**
 * Hero illustration — woman doing an overhead dumbbell press
 * Used on the home page.
 */
export function WomanWorkoutIllustration({ size = 260 }) {
  const h = Math.round(size * 1.32);
  return (
    <svg width={size} height={h} viewBox="0 0 220 290" fill="none" aria-hidden="true">
      {/* Background circle */}
      <circle cx="110" cy="162" r="118" fill="#EBF5FD" />

      {/* ── Shoes ── */}
      <path d="M58 272 Q72 266 84 270 L84 277 Q71 282 58 277Z" fill="#e07535" />
      <ellipse cx="71" cy="277" rx="14" ry="6" fill="#F4874B" />

      <path d="M136 272 Q148 266 162 270 L162 277 Q149 282 136 277Z" fill="#e07535" />
      <ellipse cx="149" cy="277" rx="14" ry="6" fill="#F4874B" />

      {/* ── Legs ── */}
      {/* left thigh */}
      <path d="M91 184 Q82 215 76 257" stroke="#1a5e94" strokeWidth="23" strokeLinecap="round" fill="none" />
      {/* left shin */}
      <path d="M76 257 Q73 267 71 273" stroke="#1a5e94" strokeWidth="19" strokeLinecap="round" fill="none" />
      {/* right thigh */}
      <path d="M129 184 Q138 215 144 257" stroke="#1a5e94" strokeWidth="23" strokeLinecap="round" fill="none" />
      {/* right shin */}
      <path d="M144 257 Q147 267 149 273" stroke="#1a5e94" strokeWidth="19" strokeLinecap="round" fill="none" />

      {/* Knee highlights */}
      <circle cx="78"  cy="230" r="9" fill="#1a72b5" opacity="0.35" />
      <circle cx="142" cy="230" r="9" fill="#1a72b5" opacity="0.35" />

      {/* ── Torso ── */}
      <path d="M81 108 Q74 142 78 174 Q92 185 110 186 Q128 185 142 174 Q146 142 139 108 Q124 99 110 99 Q96 99 81 108Z" fill="#4BA3E3" />
      {/* Sports top neckline */}
      <path d="M81 108 Q96 99 110 99 Q124 99 139 108 Q124 118 110 119 Q96 118 81 108Z" fill="#3590d4" />
      {/* Shoulder caps */}
      <circle cx="79"  cy="114" r="9" fill="#3590d4" opacity="0.55" />
      <circle cx="141" cy="114" r="9" fill="#3590d4" opacity="0.55" />
      {/* Waistband */}
      <path d="M78 174 Q110 183 142 174 Q128 178 110 179 Q92 178 78 174Z" fill="#164f7d" />

      {/* ── Arms ── */}
      {/* left upper arm */}
      <path d="M81 114 Q63 92 55 68" stroke="#F2B98A" strokeWidth="16" strokeLinecap="round" fill="none" />
      {/* left forearm */}
      <path d="M55 68 Q49 51 49 36" stroke="#F2B98A" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* right upper arm */}
      <path d="M139 114 Q157 92 165 68" stroke="#F2B98A" strokeWidth="16" strokeLinecap="round" fill="none" />
      {/* right forearm */}
      <path d="M165 68 Q171 51 171 36" stroke="#F2B98A" strokeWidth="14" strokeLinecap="round" fill="none" />

      {/* ── Dumbbells ── */}
      {/* left */}
      <rect x="34" y="28" width="28" height="7" rx="3.5" fill="#2d3748" />
      <rect x="30" y="23" width="8"  height="17" rx="3"   fill="#2d3748" />
      <rect x="58" y="23" width="8"  height="17" rx="3"   fill="#2d3748" />
      {/* right */}
      <rect x="158" y="28" width="28" height="7" rx="3.5" fill="#2d3748" />
      <rect x="154" y="23" width="8"  height="17" rx="3"   fill="#2d3748" />
      <rect x="182" y="23" width="8"  height="17" rx="3"   fill="#2d3748" />

      {/* ── Neck ── */}
      <path d="M102 78 L102 99 Q110 101 118 99 L118 78 Q110 75 102 78Z" fill="#F2B98A" />

      {/* ── Head ── */}
      <circle cx="110" cy="60" r="23" fill="#F2B98A" />

      {/* Hair back (behind head) */}
      <path d="M88 52 Q89 30 110 26 Q131 30 132 52 Q128 34 110 32 Q92 34 88 52Z" fill="#2d1810" />
      {/* Bun */}
      <circle cx="110" cy="30" r="11" fill="#2d1810" />
      {/* Hair tie */}
      <ellipse cx="110" cy="30" rx="5" ry="4" fill="#F4874B" />

      {/* Headband */}
      <path d="M88 47 Q110 40 132 47" stroke="#F4874B" strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* Face */}
      {/* left brow */}
      <path d="M100 53 Q104 50 108 52" stroke="#7a4520" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* right brow */}
      <path d="M112 52 Q116 50 120 53" stroke="#7a4520" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* eyes */}
      <ellipse cx="103" cy="60" rx="3" ry="3.5" fill="#3d2010" />
      <ellipse cx="117" cy="60" rx="3" ry="3.5" fill="#3d2010" />
      {/* eye shine */}
      <circle cx="104.5" cy="58.5" r="1" fill="white" />
      <circle cx="118.5" cy="58.5" r="1" fill="white" />
      {/* nose */}
      <path d="M110 64 Q112 68 110 70" stroke="#c47a50" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* smile */}
      <path d="M104 74 Q110 79 116 74" stroke="#c47a50" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* cheeks */}
      <ellipse cx="99"  cy="68" rx="5" ry="3" fill="#F4874B" opacity="0.2" />
      <ellipse cx="121" cy="68" rx="5" ry="3" fill="#F4874B" opacity="0.2" />

      {/* ── Decorative elements ── */}
      <circle cx="25"  cy="110" r="4.5" fill="#F4874B" opacity="0.45" />
      <circle cx="197" cy="130" r="3.5" fill="#4BA3E3" opacity="0.4" />
      <circle cx="18"  cy="188" r="3"   fill="#F4874B" opacity="0.3" />
      <circle cx="200" cy="200" r="4"   fill="#4BA3E3" opacity="0.3" />
      <circle cx="185" cy="72"  r="2.5" fill="#F4874B" opacity="0.4" />
      <circle cx="32"  cy="75"  r="2.5" fill="#F4874B" opacity="0.4" />

      {/* Motion lines by dumbbells */}
      <line x1="16" y1="32" x2="24" y2="34" stroke="#4BA3E3" strokeWidth="2"   strokeLinecap="round" opacity="0.5" />
      <line x1="14" y1="40" x2="23" y2="40" stroke="#4BA3E3" strokeWidth="2"   strokeLinecap="round" opacity="0.3" />
      <line x1="204" y1="32" x2="196" y2="34" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="206" y1="40" x2="197" y2="40" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/** Yoga pose — woman in tree/warrior position */
export function YogaIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="108" rx="38" ry="6" fill="#d4ecfa" />
      {/* standing leg */}
      <path d="M60 88 Q58 98 56 107" stroke="#1a5e94" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* raised leg (tree pose) */}
      <path d="M60 88 Q52 88 45 80 Q40 72 48 70" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* torso */}
      <path d="M50 54 Q48 70 52 85 Q56 90 60 90 Q64 90 68 85 Q72 70 70 54 Q64 50 60 50 Q56 50 50 54Z" fill="#4BA3E3" />
      {/* arms up */}
      <path d="M50 60 Q38 48 32 34" stroke="#F2B98A" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M70 60 Q82 48 88 34" stroke="#F2B98A" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck */}
      <rect x="56" y="42" width="8" height="10" rx="4" fill="#F2B98A" />
      {/* head */}
      <circle cx="60" cy="36" r="14" fill="#F2B98A" />
      {/* hair */}
      <path d="M46 32 Q48 18 60 16 Q72 18 74 32 Q70 22 60 21 Q50 22 46 32Z" fill="#2d1810" />
      <circle cx="60" cy="19" r="7" fill="#2d1810" />
      <ellipse cx="60" cy="19" rx="3" ry="2.5" fill="#F4874B" />
      {/* headband */}
      <path d="M47 29 Q60 24 73 29" stroke="#F4874B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* eyes + smile */}
      <circle cx="56" cy="37" r="1.8" fill="#3d2010" />
      <circle cx="64" cy="37" r="1.8" fill="#3d2010" />
      <path d="M57 43 Q60 46 63 43" stroke="#c47a50" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* dots */}
      <circle cx="22" cy="55" r="3" fill="#F4874B" opacity="0.4" />
      <circle cx="100" cy="60" r="2.5" fill="#4BA3E3" opacity="0.4" />
    </svg>
  );
}

/** Running / cardio woman figure */
export function RunIllustration({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* shoe back */}
      <ellipse cx="62" cy="70" rx="9" ry="4" fill="#F4874B" />
      {/* shoe front */}
      <ellipse cx="18" cy="66" rx="9" ry="4" fill="#F4874B" />
      {/* back leg */}
      <path d="M48 52 Q58 60 62 68" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* front leg */}
      <path d="M38 52 Q28 58 20 64" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* torso */}
      <path d="M34 26 Q30 38 34 52 Q40 56 46 54 Q52 50 52 38 Q52 27 46 22 Q40 20 34 26Z" fill="#4BA3E3" />
      {/* back arm */}
      <path d="M36 32 Q24 38 18 44" stroke="#F2B98A" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* front arm */}
      <path d="M50 32 Q60 25 66 18" stroke="#F2B98A" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* neck */}
      <rect x="37" y="16" width="7" height="9" rx="3.5" fill="#F2B98A" />
      {/* head */}
      <circle cx="40" cy="12" r="11" fill="#F2B98A" />
      {/* hair ponytail */}
      <path d="M30 9 Q32 1 40 0 Q48 1 50 9 Q47 3 40 2 Q33 3 30 9Z" fill="#2d1810" />
      <path d="M50 6 Q60 2 64 7" stroke="#2d1810" strokeWidth="4" strokeLinecap="round" />
      {/* eyes */}
      <circle cx="37" cy="12" r="1.5" fill="#3d2010" />
      <circle cx="43" cy="12" r="1.5" fill="#3d2010" />
      <path d="M37 17 Q40 19 43 17" stroke="#c47a50" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* motion lines */}
      <line x1="8"  y1="40" x2="16" y2="40" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="6"  y1="47" x2="15" y2="47" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/** Strength / weight training woman */
export function StrengthIllustration({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* left shoe */}
      <ellipse cx="22" cy="75" rx="9" ry="4" fill="#F4874B" />
      {/* right shoe */}
      <ellipse cx="58" cy="75" rx="9" ry="4" fill="#F4874B" />
      {/* legs */}
      <path d="M34 56 Q28 64 22 72" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M46 56 Q52 64 58 72" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* torso */}
      <path d="M26 28 Q24 42 28 56 Q34 60 40 60 Q46 60 52 56 Q56 42 54 28 Q47 22 40 22 Q33 22 26 28Z" fill="#4BA3E3" />
      {/* left arm */}
      <path d="M27 34 Q14 32 8 30" stroke="#F2B98A" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* right arm */}
      <path d="M53 34 Q66 32 72 30" stroke="#F2B98A" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* barbell */}
      <rect x="5" y="26" width="70" height="7" rx="3.5" fill="#2d3748" opacity="0.85" />
      <rect x="2"  y="22" width="8" height="15" rx="3" fill="#374151" />
      <rect x="70" y="22" width="8" height="15" rx="3" fill="#374151" />
      {/* neck */}
      <rect x="36" y="14" width="8" height="10" rx="4" fill="#F2B98A" />
      {/* head */}
      <circle cx="40" cy="10" r="11" fill="#F2B98A" />
      {/* hair */}
      <path d="M29 8 Q31 0 40 -1 Q49 0 51 8 Q48 2 40 1 Q32 2 29 8Z" fill="#2d1810" />
      <circle cx="40" cy="1" r="6" fill="#2d1810" />
      <ellipse cx="40" cy="1" rx="3" ry="2.5" fill="#F4874B" />
      {/* headband */}
      <path d="M30 6 Q40 2 50 6" stroke="#F4874B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* eyes + smile */}
      <circle cx="36" cy="11" r="1.8" fill="#3d2010" />
      <circle cx="44" cy="11" r="1.8" fill="#3d2010" />
      <path d="M37 16 Q40 19 43 16" stroke="#c47a50" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Dumbbell icon illustration */
export function DumbbellIllustration({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8"  y="26" width="12" height="12" rx="4" fill="#4BA3E3" />
      <rect x="4"  y="22" width="8"  height="20" rx="3" fill="#4BA3E3" opacity="0.7" />
      <rect x="44" y="26" width="12" height="12" rx="4" fill="#4BA3E3" />
      <rect x="52" y="22" width="8"  height="20" rx="3" fill="#4BA3E3" opacity="0.7" />
      <rect x="20" y="29" width="24" height="6"  rx="3" fill="#4BA3E3" opacity="0.9" />
    </svg>
  );
}

/** Profile / person with heart */
export function ProfileIllustration({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#EBF5FD" />
      {/* legs */}
      <path d="M38 78 Q34 88 32 95" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M62 78 Q66 88 68 95" stroke="#1a5e94" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* torso */}
      <path d="M32 50 Q30 62 32 74 Q40 80 50 80 Q60 80 68 74 Q70 62 68 50 Q60 44 50 44 Q40 44 32 50Z" fill="#4BA3E3" />
      {/* arms */}
      <path d="M33 55 Q22 58 16 60" stroke="#F2B98A" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M67 55 Q78 58 84 60" stroke="#F2B98A" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* neck */}
      <rect x="45" y="36" width="10" height="10" rx="5" fill="#F2B98A" />
      {/* head */}
      <circle cx="50" cy="28" r="16" fill="#F2B98A" />
      {/* hair */}
      <path d="M34 24 Q36 10 50 8 Q64 10 66 24 Q62 14 50 13 Q38 14 34 24Z" fill="#2d1810" />
      <circle cx="50" cy="11" r="7" fill="#2d1810" />
      {/* eyes + smile */}
      <circle cx="45" cy="29" r="2" fill="#3d2010" />
      <circle cx="55" cy="29" r="2" fill="#3d2010" />
      <path d="M46 35 Q50 39 54 35" stroke="#c47a50" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* heart */}
      <path d="M50 92 Q42 84 38 78 Q34 72 38 67 Q42 62 50 69 Q58 62 62 67 Q66 72 62 78 Q58 84 50 92Z" fill="#F4874B" opacity="0.9" />
    </svg>
  );
}

/** Empty state — no sessions yet */
export function EmptyStateIllustration({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="#f3f4f6" />
      <rect x="25" y="30" width="50" height="42" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="25" y="30" width="50" height="12" rx="6" fill="#4BA3E3" opacity="0.3" />
      <rect x="33" y="52" width="10" height="6" rx="2" fill="#d1d5db" />
      <rect x="47" y="52" width="10" height="6" rx="2" fill="#d1d5db" />
      <rect x="61" y="52" width="10" height="6" rx="2" fill="#d1d5db" />
      <rect x="33" y="62" width="10" height="6" rx="2" fill="#e5e7eb" />
      <rect x="47" y="62" width="10" height="6" rx="2" fill="#e5e7eb" />
      <circle cx="72" cy="72" r="12" fill="#4BA3E3" />
      <path d="M72 66 v12 M66 72 h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
