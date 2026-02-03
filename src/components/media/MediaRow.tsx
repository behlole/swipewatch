import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, SkeletonPoster } from '../ui';
import { PosterCard } from './PosterCard';
import { useTheme, spacing, borderRadius } from '../../theme';
import { Media } from '../../types';

type SectionIcon = 'play-circle' | 'star' | 'trophy' | 'calendar' | 'heart' | 'flame' | 'film';

interface MediaRowProps {
  title: string;
  items: Media[];
  onItemPress?: (media: Media) => void;
  onSeeAllPress?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  icon?: SectionIcon;
}

const iconColorMap: Record<SectionIcon, string> = {
  'play-circle': '#3B82F6', // Blue
  'star': '#F59E0B', // Amber
  'trophy': '#10B981', // Emerald
  'calendar': '#8B5CF6', // Purple
  'heart': '#EF4444', // Red
  'flame': '#F97316', // Orange
  'film': '#6366F1', // Indigo
};

// Auto-detect icon based on title
function getIconForTitle(title: string): { icon: SectionIcon; color: string } {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('now playing') || titleLower.includes('theater')) {
    return { icon: 'play-circle', color: iconColorMap['play-circle'] };
  }
  if (titleLower.includes('popular')) {
    return { icon: 'flame', color: iconColorMap['flame'] };
  }
  if (titleLower.includes('top rated') || titleLower.includes('best')) {
    return { icon: 'trophy', color: iconColorMap['trophy'] };
  }
  if (titleLower.includes('coming') || titleLower.includes('upcoming')) {
    return { icon: 'calendar', color: iconColorMap['calendar'] };
  }
  if (titleLower.includes('trending')) {
    return { icon: 'flame', color: iconColorMap['flame'] };
  }
  if (titleLower.includes('recommend') || titleLower.includes('for you')) {
    return { icon: 'heart', color: iconColorMap['heart'] };
  }
  return { icon: 'film', color: iconColorMap['film'] };
}

export function MediaRow({
  title,
  items,
  onItemPress,
  onSeeAllPress,
  isLoading = false,
  size = 'md',
  showRating = true,
  onEndReached,
  isLoadingMore = false,
  hasMore = true,
  icon,
}: MediaRowProps) {
  const theme = useTheme();
  const { icon: autoIcon, color: iconColor } = getIconForTitle(title);
  const displayIcon = icon || autoIcon;

  const renderItem = useCallback(({ item }: { item: Media }) => (
    <PosterCard
      media={item}
      size={size}
      onPress={() => onItemPress?.(item)}
      showRating={showRating}
    />
  ), [size, onItemPress, showRating]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
      </View>
    );
  }, [isLoadingMore, theme.colors.primary]);

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <SkeletonPoster />
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.colors.background.secondary }]}>
      <Ionicons name="film-outline" size={24} color={theme.colors.text.tertiary} />
      <Text variant="body" color="tertiary">
        No items to display
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={displayIcon} size={16} color={iconColor} />
          </View>
          <Text variant="h3" style={styles.titleText}>{title}</Text>
        </View>
        {onSeeAllPress && (
          <Pressable
            onPress={onSeeAllPress}
            style={({ pressed }) => [styles.seeAllButton, pressed && { opacity: 0.6 }]}
          >
            <Text variant="bodySmall" style={{ color: theme.colors.primary[500], fontWeight: '500' }}>
              See All
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.primary[500]} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        renderSkeleton()
      ) : items.length > 0 ? (
        <FlatList
          horizontal
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onEndReached={hasMore && onEndReached ? onEndReached : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      ) : (
        renderEmpty()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  skeletonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
  },
  skeletonItem: {
    marginRight: spacing.md,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.screenPadding,
    borderRadius: borderRadius.lg,
  },
  loadingMore: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
