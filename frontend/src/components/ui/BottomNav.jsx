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

function HistoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function VideosIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M10 9l6 3-6 3V9z" fill={active ? 'currentColor' : 'none'} />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </svg>
  );
}

const TABS = [
  { label: 'Home',    path: '/',         Icon: HomeIcon },
  { label: 'History', path: '/history',  Icon: HistoryIcon },
  { label: 'Videos',  path: '/videos',   Icon: VideosIcon },
  { label: 'Profile', path: '/profile',  Icon: ProfileIcon },
];

export default function BottomNav() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex safe-bottom z-50">
      {TABS.map(({ label, path, Icon }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(path));
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 tap-target transition-colors
              ${active ? 'text-blue-400' : 'text-gray-400'}`}
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
