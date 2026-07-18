import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleComplete() {
    await refreshProfile();
    // Always go home — wearable connect lives in Profile, not onboarding.
    // This prevents the OAuth redirect from firing mid-onboarding and
    // navigating the user out of the app.
    navigate('/');
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
