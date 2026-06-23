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

function ResourcesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

// Home | [+ FAB] | Resources | History
// Profile = avatar in Home header
// Videos = under + choice sheet
const TABS = [
  { label: 'Home',      path: '/',          Icon: HomeIcon },
  { label: null,        path: '/move',      Icon: PlusIcon }, // choice sheet
  { label: 'Resources', path: '/resources', Icon: ResourcesIcon },
  { label: 'History',   path: '/history',   Icon: HistoryIcon },
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
