import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Badge } from '../ui';
import { useTheme, spacing, borderRadius } from '../../theme';
import { GroupMatch } from '../../types';
import { getPosterUrl } from '../../services/tmdb';

interface MatchCardProps {
  match: GroupMatch;
  rank?: number;
  participantCount: number;
  onPress?: () => void;
}

export function MatchCard({ match, rank, participantCount, onPress }: MatchCardProps) {
  const theme = useTheme();
  const { movieSnapshot } = match;

  const posterUrl = getPosterUrl(movieSnapshot.posterPath, 'medium');

  const matchPercentage = Math.round((match.likeCount / participantCount) * 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.placeholder, { backgroundColor: theme.colors.background.tertiary }]}>
          <Ionicons name="film-outline" size={40} color={theme.colors.text.tertiary} />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      {rank && (
        <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary[500] }]}>
          <Text variant="caption" style={{ color: '#FFF', fontWeight: '700' }}>
            #{rank}
          </Text>
        </View>
      )}

      {match.isUnanimous && (
        <View style={[styles.unanimousBadge, { backgroundColor: theme.colors.success }]}>
          <Ionicons name="checkmark-circle" size={14} color="#FFF" />
          <Text variant="caption" style={{ color: '#FFF', fontWeight: '600' }}>
            Perfect Match!
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={2}>
          {movieSnapshot.title}
        </Text>

        <View style={styles.meta}>
          <Text variant="caption" color="secondary">
            {movieSnapshot.releaseYear}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={theme.colors.rating.excellent} />
            <Text variant="caption" style={{ color: theme.colors.rating.excellent }}>
              {movieSnapshot.voteAverage.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.matchBar}>
            <View
              style={[
                styles.matchProgress,
                {
                  width: `${matchPercentage}%`,
                  backgroundColor: match.isUnanimous
                    ? theme.colors.success
                    : theme.colors.primary[500],
                },
              ]}
            />
          </View>
          <Text variant="caption" color="secondary">
            {match.likeCount}/{participantCount} liked ({matchPercentage}%)
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  unanimousBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  matchInfo: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  matchBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchProgress: {
    height: '100%',
    borderRadius: 2,
  },
});
