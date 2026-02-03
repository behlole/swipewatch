import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { queryClient } from '../src/lib/queryClient';
import { useAuth } from '../src/features/auth/hooks/useAuth';
import { colors } from '../src/theme';

export { ErrorBoundary } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
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
        <ActivityIndicator size="large" color={colors.primary[500]} />
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
