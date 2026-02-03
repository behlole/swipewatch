import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useTheme, spacing, borderRadius } from '../../theme';
import { RecommendationExplanation } from '../../types/recommendations';

interface ExplanationBadgeProps {
  explanation?: RecommendationExplanation;
  compact?: boolean;
}

export function ExplanationBadge({ explanation, compact = false }: ExplanationBadgeProps) {
  const theme = useTheme();

  // Return null if no explanation
  if (!explanation) {
    return null;
  }

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (explanation?.type) {
      case 'liked_similar':
        return 'heart';
      case 'genre_fans':
        return 'people';
      case 'actor_match':
        return 'person';
      case 'director_match':
        return 'film';
      case 'trending':
        return 'trending-up';
      default:
        return 'sparkles';
    }
  };

  const getColor = () => {
    switch (explanation?.type) {
      case 'liked_similar':
        return theme.colors.primary[500];
      case 'genre_fans':
        return theme.colors.accent.watchlist; // purple
      case 'actor_match':
        return theme.colors.info; // blue
      case 'director_match':
        return theme.colors.warning; // orange
      case 'trending':
        return theme.colors.success; // green
      default:
        return theme.colors.primary[400];
    }
  };

  const iconColor = getColor();
  const backgroundColor = `${iconColor}20`; // 20% opacity

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor }]}>
        <Ionicons name={getIcon()} size={12} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Ionicons name={getIcon()} size={14} color={iconColor} />
      <Text
        variant="caption"
        numberOfLines={1}
        style={[styles.text, { color: iconColor }]}
      >
        {explanation?.text || 'Recommended'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  compactBadge: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    maxWidth: 200,
  },
});

export default ExplanationBadge;
