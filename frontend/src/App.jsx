import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckinProvider } from './context/CheckinContext';
import AppLayout from './components/ui/AppLayout';

import LoginPage            from './pages/LoginPage';
import SignupPage           from './pages/SignupPage';
import HomePage             from './pages/HomePage';
import CheckinPage          from './pages/CheckinPage';
import RecommendationPage   from './pages/RecommendationPage';
import SessionPage          from './pages/SessionPage';
import FeedbackPage         from './pages/FeedbackPage';
import HistoryPage          from './pages/HistoryPage';
import WeeklyReflectionPage from './pages/WeeklyReflectionPage';
import ProfilePage          from './pages/ProfilePage';
import VideoLibraryPage     from './pages/VideoLibraryPage';

function AuthGuard({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CheckinProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected — all wrapped in AuthGuard + AppLayout */}
            <Route path="/"          element={<AuthGuard><HomePage /></AuthGuard>} />
            <Route path="/checkin"   element={<AuthGuard><CheckinPage /></AuthGuard>} />
            <Route path="/recommend" element={<AuthGuard><RecommendationPage /></AuthGuard>} />
            <Route path="/session"   element={<AuthGuard><SessionPage /></AuthGuard>} />
            <Route path="/feedback"  element={<AuthGuard><FeedbackPage /></AuthGuard>} />
            <Route path="/history"   element={<AuthGuard><HistoryPage /></AuthGuard>} />
            <Route path="/videos"    element={<AuthGuard><VideoLibraryPage /></AuthGuard>} />
            <Route path="/reflection" element={<AuthGuard><WeeklyReflectionPage /></AuthGuard>} />
            <Route path="/profile"   element={<AuthGuard><ProfilePage /></AuthGuard>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CheckinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
