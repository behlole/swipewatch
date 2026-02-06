import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import mobileAds from 'react-native-google-mobile-ads';
import 'react-native-reanimated';

import { queryClient } from '../src/lib/queryClient';
import { useAuth } from '../src/features/auth/hooks/useAuth';
import { colors } from '../src/theme';
import { SplashScreen } from '../src/components/SplashScreen';
import { Logo } from '../src/components/Logo';

export { ErrorBoundary } from 'expo-router';

// Prevent native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });
  const [adsInitialized, setAdsInitialized] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize Google Mobile Ads SDK
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log('[Ads] Mobile Ads SDK initialized:', adapterStatuses);
        setAdsInitialized(true);
      })
      .catch((error) => {
        console.warn('[Ads] Failed to initialize Mobile Ads SDK:', error);
        setAdsInitialized(true); // Continue even if ads fail
      });
  }, []);

  useEffect(() => {
    if (fontsLoaded && adsInitialized) {
      // Hide native splash, show animated splash
      ExpoSplashScreen.hideAsync();
      setAppReady(true);
    }
  }, [fontsLoaded, adsInitialized]);

  const handleSplashComplete = () => {
    setShowAnimatedSplash(false);
  };

  // Show nothing until fonts and ads are ready
  if (!appReady) {
    return null;
  }

  // Show animated splash screen
  if (showAnimatedSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
        <StatusBar style="light" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding, isNewSignup } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    console.log('[Nav] Auth state:', { isLoading, isAuthenticated, hasCompletedOnboarding, isNewSignup, segments: segments[0] });

    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to welcome if not authenticated
      console.log('[Nav] Redirecting to welcome - not authenticated');
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Check if onboarding is needed
      if (!hasCompletedOnboarding) {
        // New signup goes to taste onboarding first
        if (isNewSignup) {
          console.log('[Nav] Redirecting to taste onboarding - new signup');
          router.replace('/(onboarding)/taste');
        } else {
          console.log('[Nav] Redirecting to onboarding - not completed');
          router.replace('/(onboarding)/genres');
        }
      } else {
        console.log('[Nav] Redirecting to tabs - authenticated and onboarding done');
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && !hasCompletedOnboarding && !inOnboardingGroup) {
      // User is authenticated but hasn't completed onboarding
      if (isNewSignup) {
        console.log('[Nav] Redirecting to taste onboarding - new signup');
        router.replace('/(onboarding)/taste');
      } else {
        console.log('[Nav] Redirecting to onboarding - authenticated but not completed');
        router.replace('/(onboarding)/genres');
      }
    }
  }, [isAuthenticated, isLoading, segments, hasCompletedOnboarding, isNewSignup]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.dark.background.primary,
        }}
      >
        <Logo size={60} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.dark.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="group" />
      <Stack.Screen
        name="media/[type]/[id]"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
