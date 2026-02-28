import React from 'react';

/** Woman in a gentle yoga/stretch pose — used on Login splash */
export function YogaIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      {/* mat */}
      <ellipse cx="60" cy="105" rx="42" ry="6" fill="#EBF5FD" />
      {/* body */}
      <ellipse cx="60" cy="72" rx="11" ry="18" fill="#4BA3E3" opacity="0.9" />
      {/* head */}
      <circle cx="60" cy="48" r="10" fill="#F9C9A0" />
      {/* hair */}
      <path d="M50 46 Q55 36 60 38 Q65 36 70 46 Q66 40 60 40 Q54 40 50 46Z" fill="#5C3D2E" />
      {/* left arm reaching up */}
      <line x1="49" y1="66" x2="32" y2="48" stroke="#4BA3E3" strokeWidth="5" strokeLinecap="round" />
      {/* right arm out */}
      <line x1="71" y1="66" x2="90" y2="60" stroke="#4BA3E3" strokeWidth="5" strokeLinecap="round" />
      {/* left leg down */}
      <line x1="54" y1="88" x2="44" y2="105" stroke="#4BA3E3" strokeWidth="5" strokeLinecap="round" />
      {/* right leg out */}
      <line x1="66" y1="88" x2="82" y2="100" stroke="#4BA3E3" strokeWidth="5" strokeLinecap="round" />
      {/* decorative dots */}
      <circle cx="28" cy="28" r="3" fill="#F4874B" opacity="0.5" />
      <circle cx="95" cy="35" r="2" fill="#4BA3E3" opacity="0.4" />
      <circle cx="18" cy="75" r="2" fill="#F4874B" opacity="0.3" />
      <circle cx="100" cy="85" r="3" fill="#4BA3E3" opacity="0.25" />
    </svg>
  );
}

/** Running / cardio figure */
export function RunIllustration({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* head */}
      <circle cx="50" cy="16" r="8" fill="#F9C9A0" />
      {/* hair */}
      <path d="M42 14 Q50 5 58 14 Q54 9 50 9 Q46 9 42 14Z" fill="#5C3D2E" />
      {/* torso */}
      <path d="M42 24 L36 50 L50 50 L58 24Z" fill="#4BA3E3" opacity="0.9" />
      {/* left arm back */}
      <line x1="42" y1="30" x2="24" y2="42" stroke="#4BA3E3" strokeWidth="4" strokeLinecap="round" />
      {/* right arm fwd */}
      <line x1="56" y1="30" x2="68" y2="20" stroke="#4BA3E3" strokeWidth="4" strokeLinecap="round" />
      {/* left leg fwd */}
      <path d="M40 50 L28 65 L32 68 L44 55Z" fill="#4BA3E3" opacity="0.85" />
      {/* right leg back */}
      <path d="M50 50 L62 62 L58 66 L46 54Z" fill="#4BA3E3" opacity="0.7" />
      {/* shoes */}
      <ellipse cx="30" cy="68" rx="6" ry="3" fill="#F4874B" />
      <ellipse cx="60" cy="66" rx="6" ry="3" fill="#F4874B" />
      {/* motion lines */}
      <line x1="14" y1="50" x2="22" y2="50" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="10" y1="56" x2="20" y2="56" stroke="#4BA3E3" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
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

/** Strength / weight training figure */
export function StrengthIllustration({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* head */}
      <circle cx="40" cy="14" r="8" fill="#F9C9A0" />
      {/* hair */}
      <path d="M32 12 Q40 3 48 12 Q44 7 40 7 Q36 7 32 12Z" fill="#5C3D2E" />
      {/* torso */}
      <rect x="29" y="22" width="22" height="24" rx="5" fill="#4BA3E3" opacity="0.9" />
      {/* arms holding bar */}
      <line x1="29" y1="30" x2="8"  y2="28" stroke="#4BA3E3" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="51" y1="30" x2="72" y2="28" stroke="#4BA3E3" strokeWidth="4.5" strokeLinecap="round" />
      {/* barbell */}
      <rect x="5"  y="24" width="70" height="8" rx="4" fill="#1f2937" opacity="0.15" />
      <rect x="2"  y="22" width="8"  height="12" rx="3" fill="#F4874B" />
      <rect x="70" y="22" width="8"  height="12" rx="3" fill="#F4874B" />
      {/* legs */}
      <rect x="29" y="44" width="10" height="24" rx="5" fill="#4BA3E3" opacity="0.8" />
      <rect x="41" y="44" width="10" height="24" rx="5" fill="#4BA3E3" opacity="0.7" />
      {/* shoes */}
      <ellipse cx="34" cy="69" rx="7" ry="4" fill="#F4874B" />
      <ellipse cx="46" cy="69" rx="7" ry="4" fill="#F4874B" />
    </svg>
  );
}

/** Profile / person with heart — used on profile page */
export function ProfileIllustration({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      {/* background circle */}
      <circle cx="50" cy="50" r="48" fill="#EBF5FD" />
      {/* body */}
      <ellipse cx="50" cy="72" rx="18" ry="16" fill="#4BA3E3" opacity="0.85" />
      {/* head */}
      <circle cx="50" cy="38" r="14" fill="#F9C9A0" />
      {/* hair */}
      <path d="M36 35 Q50 18 64 35 Q58 24 50 24 Q42 24 36 35Z" fill="#5C3D2E" />
      {/* heart */}
      <path d="M50 90 Q42 82 38 76 Q34 70 38 65 Q42 60 50 67 Q58 60 62 65 Q66 70 62 76 Q58 82 50 90Z"
            fill="#F4874B" opacity="0.9" />
    </svg>
  );
}

/** Empty state — no sessions yet */
export function EmptyStateIllustration({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="#f3f4f6" />
      {/* calendar-ish shape */}
      <rect x="25" y="30" width="50" height="42" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="25" y="30" width="50" height="12" rx="6" fill="#4BA3E3" opacity="0.3" />
      <rect x="33" y="52" width="10" height="6" rx="2" fill="#d1d5db" />
      <rect x="47" y="52" width="10" height="6" rx="2" fill="#d1d5db" />
      <rect x="61" y="52" width="10" height="6" rx="2" fill="#d1d5db" />
      <rect x="33" y="62" width="10" height="6" rx="2" fill="#e5e7eb" />
      <rect x="47" y="62" width="10" height="6" rx="2" fill="#e5e7eb" />
      {/* plus sign */}
      <circle cx="72" cy="72" r="12" fill="#4BA3E3" />
      <path d="M72 66 v12 M66 72 h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
