import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button, Chip } from '../../src/components/ui';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { usePreferencesStore, ALL_GENRES } from '../../src/stores/preferencesStore';
import { useAuthStore } from '../../src/features/auth/stores/authStore';

const CONTENT_TYPES = [
  { key: 'movie' as const, label: 'Movies', icon: 'film-outline' },
  { key: 'tv' as const, label: 'TV Shows', icon: 'tv-outline' },
  { key: 'both' as const, label: 'Both', icon: 'layers-outline' },
];

export default function GenresScreen() {
  const theme = useTheme();
  const {
    preferredGenres,
    preferredContentType,
    toggleGenre,
    setPreferredContentType,
  } = usePreferencesStore();
  const isNewSignup = useAuthStore((state) => state.isNewSignup);

  const handleContinue = () => {
    // Only show taste screen for new signups
    if (isNewSignup) {
      router.push('/(onboarding)/taste');
    } else {
      router.push('/(onboarding)/tutorial');
    }
  };

  const handleSkip = () => {
    // Only show taste screen for new signups
    if (isNewSignup) {
      router.push('/(onboarding)/taste');
    } else {
      router.push('/(onboarding)/tutorial');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary[500] + '20' }]}>
            <Ionicons name="heart" size={40} color={theme.colors.primary[500]} />
          </View>
          <Text variant="h1" align="center">
            What do you like?
          </Text>
          <Text variant="body" color="secondary" align="center">
            Select your preferences to get personalized recommendations
          </Text>
        </View>

        {/* Content Type */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">
            WHAT DO YOU WANT TO WATCH?
          </Text>
          <View style={styles.contentTypeRow}>
            {CONTENT_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => setPreferredContentType(type.key)}
                style={[
                  styles.contentTypeOption,
                  {
                    backgroundColor:
                      preferredContentType === type.key
                        ? theme.colors.primary[500]
                        : theme.colors.background.secondary,
                    flex: 1,
                  },
                ]}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={
                    preferredContentType === type.key
                      ? '#FFF'
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  variant="bodySmall"
                  style={{
                    color:
                      preferredContentType === type.key
                        ? '#FFF'
                        : theme.colors.text.primary,
                  }}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="label" color="secondary">
              FAVORITE GENRES
            </Text>
            <Text variant="caption" color="tertiary">
              {preferredGenres.length === 0
                ? 'Select at least 3'
                : `${preferredGenres.length} selected`}
            </Text>
          </View>
          <View style={styles.genreGrid}>
            {ALL_GENRES.map((genre) => {
              const isSelected = preferredGenres.includes(genre.id);
              return (
                <Pressable
                  key={genre.id}
                  onPress={() => toggleGenre(genre.id)}
                  style={[
                    styles.genreChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary[500]
                        : theme.colors.background.secondary,
                      borderColor: isSelected
                        ? theme.colors.primary[500]
                        : theme.colors.background.tertiary,
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                  <Text
                    variant="body"
                    style={{
                      color: isSelected ? '#FFF' : theme.colors.text.primary,
                    }}
                  >
                    {genre.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button onPress={handleContinue} disabled={preferredGenres.length < 3}>
          Continue
        </Button>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text variant="body" color="secondary">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contentTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  contentTypeOption: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  footer: {
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
});
