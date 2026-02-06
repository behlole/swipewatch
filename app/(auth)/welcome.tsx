import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '../../src/components/ui';
import { Logo } from '../../src/components/Logo';
import { useTheme, spacing, colors } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1A0505', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <SafeAreaView style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Logo size={100} />
          <Text variant="display2" align="center" style={styles.appName}>
            SwipeWatch
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.tagline}>
            Find your next favorite movie
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon="play-circle"
            color={colors.primary[500]}
            title="Swipe to Discover"
            description="Like Tinder, but for movies and TV shows"
          />
          <FeatureItem
            icon="people"
            color={colors.accent.watchlist}
            title="Watch Together"
            description="Match with friends to find movies everyone loves"
          />
          <FeatureItem
            icon="bookmark"
            color={colors.accent.like}
            title="Smart Watchlist"
            description="AI-powered recommendations based on your taste"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            fullWidth
            onPress={() => router.push('/(auth)/sign-up')}
            style={styles.primaryButton}
          >
            Get Started
          </Button>

          <Button
            variant="secondary"
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
  color,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.featureText}>
        <Text variant="h4" style={styles.featureTitle}>{title}</Text>
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
    backgroundColor: colors.dark.background.primary,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -height * 0.15,
    right: -width * 0.25,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: colors.primary[500],
    opacity: 0.06,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: colors.primary[500],
    opacity: 0.04,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  appName: {
    fontWeight: '800',
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  features: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dark.background.secondary,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border.subtle,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: 2,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  primaryButton: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
