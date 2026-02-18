import { router } from 'expo-router';
import React from 'react';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { TasteOnboarding } from '../../src/features/onboarding/components';

export default function TasteScreen() {
  const { completeOnboarding } = useAuth();

  const handleComplete = () => {
    // Complete onboarding and go to home
    completeOnboarding();
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
  };

  const handleSkip = () => {
    // Skip taste but still go to tutorial for first-time users
    router.push('/(onboarding)/tutorial');
  };

  return (
    <TasteOnboarding
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
