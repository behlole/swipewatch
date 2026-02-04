import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Chip, Badge } from '../../src/components/ui';
import { PosterCard } from '../../src/components/media';
import { AdNativeListItem } from '../../src/features/ads';
import { useWatchlist } from '../../src/features/watchlist/hooks/useWatchlist';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { WatchlistItem } from '../../src/types';

const AD_INTERVAL = 8; // Show ad every 8 items

type FilterOption = 'all' | 'movie' | 'tv' | 'watched' | 'unwatched';
type SortOption = 'dateAdded' | 'title' | 'rating' | 'year';

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV Shows' },
  { key: 'unwatched', label: 'To Watch' },
  { key: 'watched', label: 'Watched' },
];

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'dateAdded', label: 'Date Added', icon: 'time-outline' },
  { key: 'title', label: 'Title', icon: 'text-outline' },
  { key: 'rating', label: 'Rating', icon: 'star-outline' },
  { key: 'year', label: 'Year', icon: 'calendar-outline' },
];

export default function WatchlistScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  const { items, stats, removeItem, toggleWatched, toMedia } = useWatchlist({
    filterBy: activeFilter,
    sortBy,
  });

  const handleItemPress = (item: WatchlistItem) => {
    router.push(`/media/${item.contentType}/${item.contentId}`);
  };

  const handleLongPress = (item: WatchlistItem) => {
    Alert.alert(
      item.title,
      'What would you like to do?',
      [
        {
          text: item.watched ? 'Mark as Unwatched' : 'Mark as Watched',
          onPress: () => toggleWatched(item.contentId),
        },
        {
          text: 'Remove from Watchlist',
          style: 'destructive',
          onPress: () => removeItem(item.contentId),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderItem = useCallback(({ item, index }: { item: WatchlistItem; index: number }) => {
    const media = toMedia(item);
    // Show inline ad in list view every AD_INTERVAL items (not in grid view)
    const shouldShowAd = !isGridView && index > 0 && index % AD_INTERVAL === 0;

    if (isGridView) {
      return (
        <View style={styles.gridItem}>
          <Pressable onLongPress={() => handleLongPress(item)}>
            <PosterCard
              media={media}
              size="md"
              onPress={() => handleItemPress(item)}
              showYear
            />
          </Pressable>
          {item.watched && (
            <View style={[styles.watchedBadge, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      );
    }

    return (
      <>
        {shouldShowAd && <AdNativeListItem placement="watchlist_inline" />}
        <Pressable
          onPress={() => handleItemPress(item)}
          onLongPress={() => handleLongPress(item)}
          style={[styles.listItem, { backgroundColor: theme.colors.background.secondary }]}
        >
          <PosterCard media={media} size="sm" showRating={false} showTitle={false} />
          <View style={styles.listItemInfo}>
            <Text variant="body" numberOfLines={2}>
              {item.title}
            </Text>
            <Text variant="caption" color="secondary">
              {item.releaseYear} • {item.contentType === 'movie' ? 'Movie' : 'TV Show'}
            </Text>
            <View style={styles.listItemMeta}>
              <Ionicons name="star" size={12} color={theme.colors.rating.excellent} />
              <Text variant="caption" style={{ color: theme.colors.rating.excellent }}>
                {item.voteAverage.toFixed(1)}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => toggleWatched(item.contentId)}
            style={[
              styles.watchedToggle,
              {
                backgroundColor: item.watched
                  ? theme.colors.success
                  : theme.colors.background.tertiary,
              },
            ]}
          >
            <Ionicons
            name={item.watched ? 'checkmark' : 'eye-outline'}
            size={20}
            color={item.watched ? '#FFFFFF' : theme.colors.text.secondary}
          />
        </Pressable>
      </Pressable>
      </>
    );
  }, [isGridView, toMedia, handleItemPress, handleLongPress, toggleWatched, theme.colors]);

  const isEmpty = items.length === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="h1">Watchlist</Text>
          <Text variant="bodySmall" color="secondary">
            {stats.total} items • {stats.watched} watched
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setIsGridView(!isGridView)}
            style={[styles.iconButton, { backgroundColor: theme.colors.background.secondary }]}
          >
            <Ionicons
              name={isGridView ? 'list' : 'grid'}
              size={20}
              color={theme.colors.text.primary}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowSortMenu(!showSortMenu)}
            style={[styles.iconButton, { backgroundColor: theme.colors.background.secondary }]}
          >
            <Ionicons name="funnel-outline" size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: theme.colors.background.secondary }]}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                setSortBy(option.key);
                setShowSortMenu(false);
              }}
              style={[
                styles.sortOption,
                sortBy === option.key && { backgroundColor: theme.colors.background.tertiary },
              ]}
            >
              <Ionicons
                name={option.icon as any}
                size={18}
                color={
                  sortBy === option.key
                    ? theme.colors.primary[500]
                    : theme.colors.text.secondary
                }
              />
              <Text
                variant="body"
                style={{
                  color:
                    sortBy === option.key
                      ? theme.colors.primary[500]
                      : theme.colors.text.primary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <Chip
            key={filter.key}
            label={filter.label}
            selected={activeFilter === filter.key}
            onPress={() => setActiveFilter(filter.key)}
          />
        ))}
      </View>

      {/* Content */}
      {isEmpty ? (
        <View style={styles.emptyState}>
          <View
            style={[styles.iconContainer, { backgroundColor: theme.colors.background.secondary }]}
          >
            <Ionicons name="bookmark-outline" size={48} color={theme.colors.text.secondary} />
          </View>
          <Text variant="h3" align="center">
            {activeFilter === 'all'
              ? 'Your Watchlist is Empty'
              : `No ${activeFilter === 'movie' ? 'Movies' : activeFilter === 'tv' ? 'TV Shows' : activeFilter === 'watched' ? 'Watched Items' : 'Items to Watch'}`}
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'Swipe right on movies you like to add them here'
              : 'Try changing your filters'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? 'grid' : 'list'}
          contentContainerStyle={[
            styles.listContent,
            isGridView && styles.gridContent,
          ]}
          columnWrapperStyle={isGridView ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'flex-start',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sortMenu: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  gridContent: {
    gap: spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    position: 'relative',
  },
  watchedBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  listItemInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  watchedToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});
