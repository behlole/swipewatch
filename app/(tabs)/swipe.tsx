import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Chip, Button } from '../../src/components/ui';
import { SwipeStack } from '../../src/components/swipe';
import { useSwipeDeck } from '../../src/features/swipe/hooks/useSwipeDeck';
import { useSwipeStore } from '../../src/features/swipe/stores/swipeStore';
import { useInterstitialAd, useAdStore } from '../../src/features/ads';
import { useTheme, spacing } from '../../src/theme';
import { GENRE_NAMES } from '../../src/lib/constants';
import { Media } from '../../src/types';

export default function SwipeScreen() {
  const theme = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const { currentFilters, setFilters } = useSwipeStore();
  const { items, isLoading, onSwipe, onUndo, canUndo, error } = useSwipeDeck();

  // Ad integration
  const { shouldShowInterstitial, recordSwipe, resetSwipeCount } = useAdStore();
  const { showAd, isReady: adReady } = useInterstitialAd({
    placement: 'swipe_interstitial',
    onClose: () => resetSwipeCount(),
  });

  const handleSwipe = useCallback(
    (item: Media, direction: 'left' | 'right', engagement?: any) => {
      // Record swipe for ad frequency tracking
      recordSwipe();

      // Call the original swipe handler
      onSwipe(item, direction, engagement);

      // Check if we should show an interstitial ad
      if (shouldShowInterstitial() && adReady) {
        showAd();
      }
    },
    [onSwipe, recordSwipe, shouldShowInterstitial, adReady, showAd]
  );

  const handleCardPress = (media: Media) => {
    router.push(`/media/${media.type}/${media.id}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2">Discover</Text>
        <Pressable
          onPress={() => setShowFilters(true)}
          style={[styles.filterButton, { backgroundColor: theme.colors.background.secondary }]}
        >
          <Ionicons name="options-outline" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {/* Active Filters */}
      {currentFilters.genres.length > 0 && (
        <View style={styles.activeFilters}>
          {currentFilters.genres.slice(0, 3).map((genreId) => (
            <Chip
              key={genreId}
              label={GENRE_NAMES[genreId] || 'Unknown'}
              selected
              onRemove={() =>
                setFilters({
                  genres: currentFilters.genres.filter((g) => g !== genreId),
                })
              }
            />
          ))}
          {currentFilters.genres.length > 3 && (
            <Text variant="caption" color="secondary">
              +{currentFilters.genres.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Swipe Stack */}
      <View style={styles.stackContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text variant="body" color="secondary" align="center" style={styles.errorText}>
              {error.message}
            </Text>
            <Button onPress={() => {}} variant="secondary">
              Try Again
            </Button>
          </View>
        ) : (
          <SwipeStack
            items={items}
            onSwipe={handleSwipe}
            onCardPress={handleCardPress}
            onUndo={onUndo}
            canUndo={canUndo}
            isLoading={isLoading}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

function FilterModal({ visible, onClose }: FilterModalProps) {
  const theme = useTheme();
  const { currentFilters, setFilters } = useSwipeStore();
  const [localFilters, setLocalFilters] = useState(currentFilters);

  const allGenres = Object.entries(GENRE_NAMES);

  const toggleGenre = (genreId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((g) => g !== genreId)
        : [...prev.genres, genreId],
    }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    onClose();
  };

  const resetFilters = () => {
    const defaultFilters = {
      contentType: 'movie' as const,
      genres: [],
      minRating: 6,
      minYear: 2000,
      maxYear: new Date().getFullYear(),
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}
      >
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text variant="h3">Filters</Text>
          <Pressable onPress={resetFilters}>
            <Text variant="body" style={{ color: theme.colors.primary[500] }}>
              Reset
            </Text>
          </Pressable>
        </View>

        {/* Content Type */}
        <View style={styles.filterSection}>
          <Text variant="h4" style={styles.sectionTitle}>
            Content Type
          </Text>
          <View style={styles.chipGroup}>
            {(['movie', 'tv', 'both'] as const).map((type) => (
              <Chip
                key={type}
                label={type === 'tv' ? 'TV Shows' : type === 'both' ? 'Both' : 'Movies'}
                selected={localFilters.contentType === type}
                onPress={() => setLocalFilters((prev) => ({ ...prev, contentType: type }))}
              />
            ))}
          </View>
        </View>

        {/* Genres */}
        <View style={styles.filterSection}>
          <Text variant="h4" style={styles.sectionTitle}>
            Genres
          </Text>
          <View style={styles.chipGroup}>
            {allGenres.map(([id, name]) => (
              <Chip
                key={id}
                label={name}
                selected={localFilters.genres.includes(Number(id))}
                onPress={() => toggleGenre(Number(id))}
              />
            ))}
          </View>
        </View>

        {/* Minimum Rating */}
        <View style={styles.filterSection}>
          <Text variant="h4" style={styles.sectionTitle}>
            Minimum Rating
          </Text>
          <View style={styles.chipGroup}>
            {[5, 6, 7, 8].map((rating) => (
              <Chip
                key={rating}
                label={`${rating}+`}
                selected={localFilters.minRating === rating}
                onPress={() => setLocalFilters((prev) => ({ ...prev, minRating: rating }))}
              />
            ))}
          </View>
        </View>

        {/* Apply Button */}
        <View style={styles.applyButton}>
          <Button fullWidth onPress={applyFilters}>
            Apply Filters
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
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
  filterButton: {
    padding: spacing.sm,
    borderRadius: spacing.sm,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  stackContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    marginVertical: spacing.md,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filterSection: {
    padding: spacing.screenPadding,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  applyButton: {
    padding: spacing.screenPadding,
    marginTop: 'auto',
  },
});
