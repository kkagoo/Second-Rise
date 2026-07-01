import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleComplete(selectedWearable) {
    await refreshProfile();
    if (selectedWearable === 'apple_health' && Capacitor.getPlatform() === 'ios') {
      // Native HealthKit — go to Profile with autoconnect flag, ProfilePage handles the sync
      navigate('/profile?autoconnect=apple_health');
    } else if (selectedWearable === 'apple_health') {
      // Web / Android — manual file upload flow in Profile
      navigate('/profile');
    } else if (selectedWearable) {
      navigate(`/profile?autoconnect=${selectedWearable}`);
    } else {
      navigate('/');
    }
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
