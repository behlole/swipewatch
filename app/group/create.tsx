import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button, Chip } from '../../src/components/ui';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { useGroupStore } from '../../src/features/groups/stores/groupStore';
import { useAuthStore } from '../../src/features/auth/stores/authStore';
import { WatchPartySettings, defaultWatchPartySettings } from '../../src/types';

const CONTENT_TYPES = [
  { key: 'movie', label: 'Movies', icon: 'film-outline' },
  { key: 'tv', label: 'TV Shows', icon: 'tv-outline' },
  { key: 'both', label: 'Both', icon: 'layers-outline' },
] as const;

const MOVIE_COUNTS = [10, 15, 20, 25, 30];

const POPULAR_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
];

export default function CreateGroupScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { createLocalSession, setLoading, isLoading } = useGroupStore();

  const [settings, setSettings] = useState<WatchPartySettings>(defaultWatchPartySettings);

  const updateSettings = useCallback((updates: Partial<WatchPartySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleGenre = useCallback((genreId: number) => {
    setSettings((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((g) => g !== genreId)
        : [...prev.genres, genreId],
    }));
  }, []);

  const handleCreate = async () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    setLoading(true);
    try {
      const code = createLocalSession(
        user.uid,
        user.displayName || 'Host',
        settings
      );
      router.replace(`/group/${code}/lobby`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={28} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="h2">Create Watch Party</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Content Type */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">
            WHAT TO WATCH
          </Text>
          <View style={styles.optionsRow}>
            {CONTENT_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => updateSettings({ contentType: type.key })}
                style={[
                  styles.contentTypeOption,
                  {
                    backgroundColor:
                      settings.contentType === type.key
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
                    settings.contentType === type.key
                      ? '#FFF'
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  variant="bodySmall"
                  style={{
                    color:
                      settings.contentType === type.key
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

        {/* Movie Count */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">
            NUMBER OF {settings.contentType === 'tv' ? 'SHOWS' : 'MOVIES'}
          </Text>
          <View style={styles.optionsRow}>
            {MOVIE_COUNTS.map((count) => (
              <Pressable
                key={count}
                onPress={() => updateSettings({ movieCount: count })}
                style={[
                  styles.countOption,
                  {
                    backgroundColor:
                      settings.movieCount === count
                        ? theme.colors.primary[500]
                        : theme.colors.background.secondary,
                  },
                ]}
              >
                <Text
                  variant="body"
                  style={{
                    fontWeight: '600',
                    color:
                      settings.movieCount === count
                        ? '#FFF'
                        : theme.colors.text.primary,
                  }}
                >
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="label" color="secondary">
              GENRES
            </Text>
            <Text variant="caption" color="tertiary">
              {settings.genres.length === 0 ? 'All genres' : `${settings.genres.length} selected`}
            </Text>
          </View>
          <View style={styles.genreGrid}>
            {POPULAR_GENRES.map((genre) => (
              <Chip
                key={genre.id}
                label={genre.name}
                selected={settings.genres.includes(genre.id)}
                onPress={() => toggleGenre(genre.id)}
              />
            ))}
          </View>
        </View>

        {/* Rating Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="label" color="secondary">
              MINIMUM RATING
            </Text>
            <View style={styles.ratingValue}>
              <Ionicons name="star" size={14} color={theme.colors.rating.excellent} />
              <Text variant="body" style={{ color: theme.colors.rating.excellent }}>
                {settings.minRating.toFixed(1)}+
              </Text>
            </View>
          </View>
          <Slider
            value={settings.minRating}
            onValueChange={(value) => updateSettings({ minRating: Math.round(value * 2) / 2 })}
            minimumValue={0}
            maximumValue={9}
            step={0.5}
            minimumTrackTintColor={theme.colors.primary[500]}
            maximumTrackTintColor={theme.colors.background.tertiary}
            thumbTintColor={theme.colors.primary[500]}
            style={styles.slider}
          />
        </View>

        {/* Year Range */}
        <View style={styles.section}>
          <Text variant="label" color="secondary">
            RELEASE YEAR
          </Text>
          <View style={styles.yearRange}>
            <View style={styles.yearInput}>
              <Text variant="caption" color="secondary">From</Text>
              <Text variant="h3">{settings.minYear}</Text>
            </View>
            <View style={styles.yearDivider} />
            <View style={styles.yearInput}>
              <Text variant="caption" color="secondary">To</Text>
              <Text variant="h3">{settings.maxYear}</Text>
            </View>
          </View>
          <Slider
            value={settings.minYear}
            onValueChange={(value) => updateSettings({ minYear: Math.round(value) })}
            minimumValue={1970}
            maximumValue={settings.maxYear}
            step={1}
            minimumTrackTintColor={theme.colors.primary[500]}
            maximumTrackTintColor={theme.colors.background.tertiary}
            thumbTintColor={theme.colors.primary[500]}
            style={styles.slider}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.background.primary }]}>
        <Button
          onPress={handleCreate}
          loading={isLoading}
          leftIcon="add-circle-outline"
        >
          Create Party
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing['4xl'],
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
  optionsRow: {
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
  countOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  slider: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.sm,
  },
  yearRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  yearInput: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  yearDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  footer: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
});
