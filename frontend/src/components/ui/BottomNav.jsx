import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function ChallengesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// Home | Challenges | [+ FAB] | History | Profile
const TABS = [
  { label: 'Home',       path: '/',                Icon: HomeIcon },
  { label: 'Challenges', path: '/challenges/new',  Icon: ChallengesIcon },
  { label: null,         path: '/move',            Icon: PlusIcon },
  { label: 'History',    path: '/history',         Icon: HistoryIcon },
  { label: 'Profile',    path: '/profile',         Icon: ProfileIcon },
];

export default function BottomNav() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-bottom z-40">
      {TABS.map(({ label, path, Icon }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(path));

        if (label === null) {
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 tap-target"
            >
              <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center shadow-md text-white -mt-5">
                <PlusIcon />
              </div>
              <span className="text-[10px] font-semibold text-gray-400">Move</span>
            </button>
          );
        }

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 tap-target transition-colors ${
              active ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <Icon active={active} />
            <span className={`text-[10px] font-semibold ${active ? 'text-blue-400' : 'text-gray-400'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
