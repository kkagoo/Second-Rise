import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import client from './api/client';
import { setupDailyNotifications } from './services/notificationService';

// Fire-and-forget warmup: pings the backend immediately on app open so Railway
// is warm by the time the user attempts to log in. Silently ignored if it fails.
(function warmupBackend() {
  try { client.get('/health', { timeout: 10000 }).catch(() => {}); } catch {}
})();

// Schedule daily notifications on app launch (safe to call on every open)
setupDailyNotifications();
import { CheckinProvider } from './context/CheckinContext';
import AppLayout from './components/ui/AppLayout';

// Safety net: if an OAuth result lands somewhere other than /profile, redirect there.
// The backend encodes returnTo in the OAuth state, so this should rarely fire.
function OAuthRedirectGuard() {
  const params = new URLSearchParams(window.location.search);
  const hasOAuthResult = params.has('oura')
    || params.has('whoop')
    || params.has('googlefit')
    || params.has('fitbit');

  if (hasOAuthResult && window.location.pathname !== '/profile') {
    window.location.replace('/profile' + window.location.search);
    return null;
  }

  return null;
}

import LoginPage            from './pages/LoginPage';
import SignupPage           from './pages/SignupPage';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import ResetPasswordPage   from './pages/ResetPasswordPage';
import HomePage             from './pages/HomePage';
import CheckinPage          from './pages/CheckinPage';
import RecommendationPage   from './pages/RecommendationPage';
import SessionPage          from './pages/SessionPage';
import FeedbackPage         from './pages/FeedbackPage';
import HistoryPage          from './pages/HistoryPage';
import WeeklyReflectionPage from './pages/WeeklyReflectionPage';
import ProfilePage          from './pages/ProfilePage';
import VideoLibraryPage     from './pages/VideoLibraryPage';
import DeleteAccountPage    from './pages/DeleteAccountPage';
import LogActivityPage      from './pages/LogActivityPage';
import PainHistoryPage      from './pages/PainHistoryPage';
import ResourcesPage        from './pages/ResourcesPage';
import ActivityChoicePage   from './pages/ActivityChoicePage';
import OnboardingPage       from './pages/OnboardingPage';

const Spinner = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Full app layout with bottom nav
function AuthGuard({ children }) {
  const { token, loading, profile } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  // Only force onboarding on native app — web users go straight to home
  if (Capacitor.isNativePlatform() && profile && !profile.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

// No bottom nav — used for fullscreen flows like onboarding
function BareAuthGuard({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CheckinProvider>
          <OAuthRedirectGuard />
          <Routes>
            {/* Public */}
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/signup"          element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            {/* Protected — all wrapped in AuthGuard + AppLayout */}
            <Route path="/"          element={<AuthGuard><HomePage /></AuthGuard>} />
            <Route path="/checkin"   element={<AuthGuard><CheckinPage /></AuthGuard>} />
            <Route path="/recommend" element={<AuthGuard><RecommendationPage /></AuthGuard>} />
            <Route path="/session"   element={<AuthGuard><SessionPage /></AuthGuard>} />
            <Route path="/feedback"  element={<AuthGuard><FeedbackPage /></AuthGuard>} />
            <Route path="/history"   element={<AuthGuard><HistoryPage /></AuthGuard>} />
            <Route path="/videos"    element={<AuthGuard><VideoLibraryPage /></AuthGuard>} />
            <Route path="/reflection" element={<AuthGuard><WeeklyReflectionPage /></AuthGuard>} />
            <Route path="/profile"          element={<AuthGuard><ProfilePage /></AuthGuard>} />
            <Route path="/delete-account"   element={<AuthGuard><DeleteAccountPage /></AuthGuard>} />
            <Route path="/log-activity"     element={<AuthGuard><LogActivityPage /></AuthGuard>} />
            <Route path="/pain-history"     element={<AuthGuard><PainHistoryPage /></AuthGuard>} />
            <Route path="/resources"        element={<AuthGuard><ResourcesPage /></AuthGuard>} />
            <Route path="/move"             element={<AuthGuard><ActivityChoicePage /></AuthGuard>} />
            <Route path="/onboarding"       element={<BareAuthGuard><OnboardingPage /></BareAuthGuard>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CheckinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
