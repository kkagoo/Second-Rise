import React from 'react';
import BottomNav from './BottomNav';

/**
 * Wraps all authenticated pages with the bottom navigation bar.
 * Pages should use pb-24 (or similar) so content isn't hidden behind the nav.
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      <BottomNav />
    </div>
  );
}
