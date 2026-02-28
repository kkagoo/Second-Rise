import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckinProvider } from './context/CheckinContext';

import LoginPage            from './pages/LoginPage';
import SignupPage           from './pages/SignupPage';
import OnboardingPage       from './pages/OnboardingPage';
import HomePage             from './pages/HomePage';
import CheckinPage          from './pages/CheckinPage';
import RecommendationPage   from './pages/RecommendationPage';
import SessionPage          from './pages/SessionPage';
import FeedbackPage         from './pages/FeedbackPage';
import HistoryPage          from './pages/HistoryPage';
import WeeklyReflectionPage from './pages/WeeklyReflectionPage';
import ProfilePage          from './pages/ProfilePage';

function AuthGuard({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sunrise-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function OnboardingGuard({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
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

            {/* Onboarding (auth required, no onboarding guard) */}
            <Route path="/onboarding" element={
              <AuthGuard><OnboardingPage /></AuthGuard>
            } />

            {/* Protected + onboarding complete */}
            <Route path="/" element={
              <AuthGuard><OnboardingGuard><HomePage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/checkin" element={
              <AuthGuard><OnboardingGuard><CheckinPage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/recommend" element={
              <AuthGuard><OnboardingGuard><RecommendationPage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/session" element={
              <AuthGuard><OnboardingGuard><SessionPage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/feedback" element={
              <AuthGuard><OnboardingGuard><FeedbackPage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/history" element={
              <AuthGuard><OnboardingGuard><HistoryPage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/reflection" element={
              <AuthGuard><OnboardingGuard><WeeklyReflectionPage /></OnboardingGuard></AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard><OnboardingGuard><ProfilePage /></OnboardingGuard></AuthGuard>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CheckinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
