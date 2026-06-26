import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleComplete(selectedWearable) {
    await refreshProfile();
    if (selectedWearable === 'apple_health') {
      navigate('/profile');
    } else if (selectedWearable) {
      // Route to Profile with autoconnect param — Profile fires OAuth and receives the callback
      navigate(`/profile?autoconnect=${selectedWearable}`);
    } else {
      navigate('/');
    }
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
