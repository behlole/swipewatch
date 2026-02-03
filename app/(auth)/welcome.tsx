import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Text, Button } from '../../src/components/ui';
import { useTheme, spacing } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';

// Required for web browser auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const theme = useTheme();
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      setError('Google sign-in failed');
      setIsGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      await signInWithGoogle(idToken);
    } catch (err) {
      setError('Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  const onGooglePress = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setError('Could not start Google sign-in');
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image Placeholder */}
      <LinearGradient
        colors={[theme.colors.primary[900], theme.colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text variant="display2" align="center" style={styles.logo}>
            SwipeWatch
          </Text>
          <Text variant="body" color="secondary" align="center">
            Find your next favorite movie
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="🎬"
            title="Swipe to Discover"
            description="Like Tinder, but for movies"
          />
          <FeatureItem
            icon="👥"
            title="Watch Together"
            description="Find movies everyone will love"
          />
          <FeatureItem
            icon="📺"
            title="Track Your Watchlist"
            description="Never forget what to watch"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
          >
            Get Started
          </Button>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
            <Text variant="caption" color="tertiary" style={styles.dividerText}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
          </View>

          <Button
            variant="secondary"
            fullWidth
            leftIcon="logo-google"
            onPress={onGooglePress}
            loading={isGoogleLoading}
            disabled={!request}
          >
            Continue with Google
          </Button>

          <Button
            variant="ghost"
            fullWidth
            onPress={() => router.push('/(auth)/sign-in')}
          >
            I already have an account
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Text variant="display1" style={styles.featureIcon}>
        {icon}
      </Text>
      <View style={styles.featureText}>
        <Text variant="h4">{title}</Text>
        <Text variant="bodySmall" color="secondary">
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.screenPadding,
  },
  header: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
  },
  logo: {
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  features: {
    gap: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureIcon: {
    fontSize: 40,
  },
  featureText: {
    flex: 1,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
});
