import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button } from '../../src/components/ui';
import { useTheme, spacing } from '../../src/theme';

export default function WelcomeScreen() {
  const theme = useTheme();

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
});
