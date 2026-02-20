import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useTheme, spacing, borderRadius, shadows, getRatingColor } from '../../theme';
import { Media } from '../../types';
import { getPosterUrl } from '../../services/tmdb';

type PosterSize = 'sm' | 'md' | 'lg';

const SIZE_CONFIG: Record<PosterSize, { width: number; height: number }> = {
  sm: { width: 100, height: 150 },
  md: { width: 140, height: 210 },
  lg: { width: 180, height: 270 },
};

const POSTER_ASPECT = 210 / 140; // height/width for md

interface PosterCardProps {
  media: Media;
  size?: PosterSize;
  /** When set (e.g. for grid), card fills this width; height is derived from aspect ratio */
  width?: number;
  onPress?: () => void;
  showRating?: boolean;
  showTitle?: boolean;
  showYear?: boolean;
  inWatchlist?: boolean;
  /** Tighter spacing for grid layout */
  compact?: boolean;
}

export function PosterCard({
  media,
  size = 'md',
  width: widthProp,
  onPress,
  showRating = true,
  showTitle = true,
  showYear = false,
  inWatchlist = false,
  compact = false,
}: PosterCardProps) {
  const theme = useTheme();
  const sizeConfig = SIZE_CONFIG[size];
  const width = widthProp ?? sizeConfig.width;
  const height = widthProp ? Math.round(widthProp * POSTER_ASPECT) : sizeConfig.height;
  const posterUrl = getPosterUrl(media.posterPath, width <= 100 ? 'small' : 'medium');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        compact && styles.containerCompact,
        { width, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.posterContainer, { width, height }, shadows.md]}>
        <Image
          source={{ uri: posterUrl || undefined }}
          style={[styles.poster, { width, height }]}
          contentFit="cover"
          transition={200}
        />

        {/* Rating Badge */}
        {showRating && media.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons
              name="star"
              size={10}
              color={getRatingColor(media.rating)}
            />
            <Text
              variant="captionSmall"
              style={[styles.ratingText, { color: getRatingColor(media.rating) }]}
            >
              {media.rating.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Watchlist Indicator */}
        {inWatchlist && (
          <View style={[styles.watchlistBadge, { backgroundColor: theme.colors.primary[500] }]}>
            <Ionicons name="bookmark" size={12} color="#FFFFFF" />
          </View>
        )}

        {/* Type Badge for TV Shows */}
        {media.type === 'tv' && (
          <View style={[styles.typeBadge, { backgroundColor: theme.colors.info }]}>
            <Text variant="captionSmall" style={styles.typeText}>
              TV
            </Text>
          </View>
        )}
      </View>

      {/* Title & Year */}
      {(showTitle || showYear) && (
        <View style={[styles.info, compact && styles.infoCompact]}>
          {showTitle && (
            <Text variant="caption" numberOfLines={2} style={styles.title}>
              {media.title}
            </Text>
          )}
          {showYear && media.releaseYear > 0 && (
            <Text variant="captionSmall" color="tertiary">
              {media.releaseYear}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  containerCompact: {
    marginBottom: 0,
  },
  posterContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  poster: {
    borderRadius: borderRadius.md,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  ratingText: {
    fontWeight: '700',
  },
  watchlistBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: 4,
    borderRadius: borderRadius.sm,
  },
  typeBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  info: {
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  infoCompact: {
    marginTop: 4,
    minHeight: 36,
  },
  title: {
    fontWeight: '500',
  },
});
