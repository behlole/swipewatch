import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useTheme, spacing, borderRadius, shadows, getRatingColor } from '../../theme';
import { Media } from '../../types';
import { getBackdropUrl } from '../../services/tmdb';
import { GENRE_NAMES } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 2;
const CARD_HEIGHT = 200;

interface BackdropCardProps {
  media: Media;
  onPress?: () => void;
  rank?: number;
}

export function BackdropCard({ media, onPress, rank }: BackdropCardProps) {
  const theme = useTheme();
  const backdropUrl = getBackdropUrl(media.backdropPath, 'medium');
  const genres = media.genreIds
    .slice(0, 2)
    .map((id) => GENRE_NAMES[id])
    .filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        shadows.lg,
        { opacity: pressed ? 0.95 : 1 },
      ]}
    >
      <Image
        source={{ uri: backdropUrl || undefined }}
        style={styles.backdrop}
        contentFit="cover"
        transition={300}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        locations={[0.3, 0.7, 1]}
        style={styles.gradient}
      />

      {/* Rank Badge */}
      {rank && (
        <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary[500] }]}>
          <Text variant="h3" style={styles.rankText}>
            #{rank}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text variant="h3" numberOfLines={2} style={styles.title}>
          {media.title}
        </Text>

        <View style={styles.meta}>
          <Text variant="bodySmall" color="secondary">
            {media.releaseYear}
          </Text>
          {genres.length > 0 && (
            <>
              <View style={styles.dot} />
              <Text variant="bodySmall" color="secondary" numberOfLines={1}>
                {genres.join(', ')}
              </Text>
            </>
          )}
        </View>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={getRatingColor(media.rating)} />
          <Text
            variant="bodySmall"
            style={[styles.rating, { color: getRatingColor(media.rating) }]}
          >
            {media.rating.toFixed(1)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888',
    marginHorizontal: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rating: {
    fontWeight: '600',
  },
});
