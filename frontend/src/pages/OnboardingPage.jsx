import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleComplete() {
    await refreshProfile();
    navigate('/');
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
