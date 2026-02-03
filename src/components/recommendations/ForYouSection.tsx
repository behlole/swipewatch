import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Skeleton } from '../ui';
import { ExplanationBadge } from './ExplanationBadge';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useRecommendations } from '../../hooks/useRecommendations';
import { Recommendation } from '../../types/recommendations';
import { getPosterUrl } from '../../services/tmdb';
import { Image } from 'expo-image';

interface ForYouSectionProps {
  onItemPress: (recommendation: Recommendation) => void;
  onImprovePress?: () => void;
}

export function ForYouSection({ onItemPress, onImprovePress }: ForYouSectionProps) {
  const theme = useTheme();
  const { recommendations, isLoading, isLoadingMore, confidence, hasMore, loadMore } = useRecommendations(15);

  const renderItem = useCallback(({ item }: { item: Recommendation }) => (
    <RecommendationCard
      recommendation={item}
      onPress={() => onItemPress(item)}
    />
  ), [onItemPress]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.accent.ai} />
      </View>
    );
  }, [isLoadingMore, theme.colors.accent]);

  // Loading state with AI-themed skeleton
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.colors.accent.ai + '20', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.titleRow}>
              <View style={[styles.aiIconContainer, { backgroundColor: theme.colors.accent.aiBg }]}>
                <Ionicons name="sparkles" size={16} color={theme.colors.accent.ai} />
              </View>
              <Text variant="h3" style={styles.sectionTitle}>For You</Text>
              <View style={[styles.aiBadge, { backgroundColor: theme.colors.accent.aiBg }]}>
                <Text variant="caption" style={{ color: theme.colors.accent.ai, fontWeight: '600', fontSize: 10 }}>
                  AI
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.cardSkeleton}>
              <Skeleton width={140} height={210} borderRadius={borderRadius.lg} />
              <Skeleton width={100} height={16} borderRadius={borderRadius.sm} style={{ marginTop: spacing.sm }} />
              <Skeleton width={80} height={12} borderRadius={borderRadius.sm} style={{ marginTop: spacing.xs }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Empty state with AI-themed prompt
  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.colors.accent.ai + '20', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.titleRow}>
              <View style={[styles.aiIconContainer, { backgroundColor: theme.colors.accent.aiBg }]}>
                <Ionicons name="sparkles" size={16} color={theme.colors.accent.ai} />
              </View>
              <Text variant="h3" style={styles.sectionTitle}>For You</Text>
            </View>
          </LinearGradient>
        </View>
        <Pressable
          onPress={onImprovePress}
          style={({ pressed }) => [
            styles.emptyState,
            { backgroundColor: theme.colors.background.secondary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="bulb-outline" size={28} color="#FFF" />
          </LinearGradient>
          <Text variant="body" align="center" style={styles.emptyTitle}>
            Train your AI recommendations
          </Text>
          <Text variant="caption" color="secondary" align="center" style={{ maxWidth: 240 }}>
            Like a few movies to help our AI understand your taste
          </Text>
          <LinearGradient
            colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.improveButton}
          >
            <Ionicons name="heart" size={16} color="#FFF" />
            <Text variant="body" style={{ color: '#FFF', fontWeight: '600' }}>
              Pick Movies
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.accent.ai + '15', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.titleRow}>
            <View style={[styles.aiIconContainer, { backgroundColor: theme.colors.accent.aiBg }]}>
              <Ionicons name="sparkles" size={16} color={theme.colors.accent.ai} />
            </View>
            <Text variant="h3" style={styles.sectionTitle}>For You</Text>
            <View style={[styles.aiBadge, { backgroundColor: theme.colors.accent.aiBg }]}>
              <Text variant="caption" style={{ color: theme.colors.accent.ai, fontWeight: '600', fontSize: 10 }}>
                AI
              </Text>
            </View>
          </View>
          {confidence !== 'low' && (
            <View style={[styles.confidenceBadge, {
              backgroundColor: confidence === 'high' ? theme.colors.accent.like + '20' : theme.colors.accent.aiBg
            }]}>
              <Ionicons
                name={confidence === 'high' ? 'checkmark-circle' : 'trending-up'}
                size={12}
                color={confidence === 'high' ? theme.colors.accent.like : theme.colors.accent.ai}
              />
              <Text variant="caption" style={{
                color: confidence === 'high' ? theme.colors.accent.like : theme.colors.accent.ai,
                fontWeight: '500',
                fontSize: 11,
              }}>
                {confidence === 'high' ? 'Highly personalized' : 'Learning your taste'}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      <FlatList
        horizontal
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.contentType}-${item.contentId}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onPress: () => void;
}

function RecommendationCard({ recommendation, onPress }: RecommendationCardProps) {
  const theme = useTheme();
  const matchScore = Math.round(recommendation.score * 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.posterContainer, { borderColor: theme.colors.border.subtle }]}>
        {recommendation.posterPath ? (
          <Image
            source={{ uri: getPosterUrl(recommendation.posterPath, 'medium') }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: theme.colors.background.tertiary }]}>
            <Ionicons name="film-outline" size={32} color={theme.colors.text.tertiary} />
          </View>
        )}

        {/* AI Match Score Badge */}
        <LinearGradient
          colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.matchBadge}
        >
          <Text style={styles.matchText}>{matchScore}%</Text>
          <Text style={styles.matchLabel}>match</Text>
        </LinearGradient>

        {/* Rating badge */}
        {recommendation.voteAverage > 0 && (
          <View style={[styles.ratingBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
            <Ionicons name="star" size={10} color={theme.colors.accent.yellow} />
            <Text variant="caption" style={styles.ratingText}>
              {recommendation.voteAverage.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Content type badge */}
        <View style={[styles.typeBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
          <Ionicons
            name={recommendation.contentType === 'movie' ? 'film' : 'tv'}
            size={10}
            color="#FFF"
          />
        </View>

        {/* Bottom gradient for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        />
      </View>

      <View style={styles.cardContent}>
        <Text variant="body" numberOfLines={2} style={styles.title}>
          {recommendation.title}
        </Text>
        <View style={styles.cardMeta}>
          {recommendation.releaseYear > 0 && (
            <Text variant="caption" color="tertiary" style={{ fontSize: 11 }}>
              {recommendation.releaseYear}
            </Text>
          )}
        </View>
        <ExplanationBadge explanation={recommendation.explanation} compact />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginHorizontal: -spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  aiIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  emptyState: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  improveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  loadingMore: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSkeleton: {
    width: 140,
  },
  card: {
    width: 140,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  posterContainer: {
    position: 'relative',
    width: 140,
    height: 210,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  matchText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  matchLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  cardContent: {
    marginTop: spacing.sm,
    gap: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
  },
});

export default ForYouSection;
