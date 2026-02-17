import { Redirect } from 'expo-router';
import { useAuth } from '../src/features/auth/hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding, isNewSignup } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated but onboarding not done → send to onboarding (avoids double redirect)
  if (!hasCompletedOnboarding) {
    return <Redirect href={isNewSignup ? '/(onboarding)/taste' : '/(onboarding)/genres'} />;
  }

  return <Redirect href="/(tabs)" />;
}
