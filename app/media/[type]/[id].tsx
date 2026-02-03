import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Text, Button, Chip, Avatar, Skeleton } from '../../../src/components/ui';
import { useTheme, spacing, borderRadius, getRatingColor } from '../../../src/theme';
import {
  getMovieDetails,
  getTVDetails,
  transformMovieDetails,
  transformTVDetails,
  getBackdropUrl,
  getProfileUrl,
} from '../../../src/services/tmdb';
import { useWatchlistStore } from '../../../src/features/watchlist/stores/watchlistStore';
import { useAuthStore } from '../../../src/features/auth/stores/authStore';
import { seedTasteProfileFromOnboarding, updateTasteProfileFromSwipe, getTasteProfile } from '../../../src/services/firebase/tasteProfile';
import { clearRecommendationCache } from '../../../src/hooks/useRecommendations';
import { MovieDetails, TVDetails, Media } from '../../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKDROP_HEIGHT = 320;

export default function MediaDetailScreen() {
  const theme = useTheme();
  const { type, id, explanation } = useLocalSearchParams<{ type: string; id: string; explanation?: string }>();
  const [media, setMedia] = useState<MovieDetails | TVDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { addItem, removeItem, isInWatchlist, toggleWatched, getItem } = useWatchlistStore();
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const inWatchlist = media ? isInWatchlist(media.id) : false;
  const watchlistItem = media ? getItem(media.id) : undefined;
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  const handleLike = useCallback(async () => {
    if (!media || !firebaseUser?.uid || isLiking) return;

    setIsLiking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (!isLiked) {
        // If previously disliked, clear that state
        if (isDisliked) setIsDisliked(false);

        await seedTasteProfileFromOnboarding(firebaseUser.uid, [{
          id: media.id,
          type: media.type,
          title: media.title,
          genreIds: media.genres.map(g => g.id),
          rating: media.rating,
          releaseYear: media.releaseYear,
          popularity: media.voteCount,
        }]);
        setIsLiked(true);
        clearRecommendationCache();
      } else {
        setIsLiked(false);
      }
    } catch (err) {
      console.warn('Failed to save like:', err);
    } finally {
      setIsLiking(false);
    }
  }, [media, firebaseUser?.uid, isLiked, isDisliked, isLiking]);

  const handleDislike = useCallback(async () => {
    if (!media || !firebaseUser?.uid || isDisliking) return;

    setIsDisliking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (!isDisliked) {
        // If previously liked, clear that state
        if (isLiked) setIsLiked(false);

        await updateTasteProfileFromSwipe(firebaseUser.uid, {
          direction: 'left',
          features: {
            genreIds: media.genres.map(g => g.id),
          },
          contentSnapshot: {
            voteAverage: media.rating,
            releaseYear: media.releaseYear,
            popularity: media.voteCount,
          },
          engagement: {
            viewDurationMs: 5000, // Assumed view time from detail page
          },
          contentId: media.id,
        });
        setIsDisliked(true);
        clearRecommendationCache();
      } else {
        setIsDisliked(false);
      }
    } catch (err) {
      console.warn('Failed to save dislike:', err);
    } finally {
      setIsDisliking(false);
    }
  }, [media, firebaseUser?.uid, isDisliked, isLiked, isDisliking]);

  // Check if user has already liked/disliked this content
  useEffect(() => {
    async function checkInteractionStatus() {
      if (!id || !firebaseUser?.uid) return;

      try {
        const profile = await getTasteProfile(firebaseUser.uid);
        const contentId = Number(id);

        // Check if in liked list
        if (profile.recentLikedIds?.includes(contentId)) {
          setIsLiked(true);
          setIsDisliked(false);
        }
        // Check if in disliked list
        else if (profile.recentDislikedIds?.includes(contentId)) {
          setIsDisliked(true);
          setIsLiked(false);
        }
      } catch (err) {
        console.warn('Failed to check interaction status:', err);
      }
    }

    checkInteractionStatus();
  }, [id, firebaseUser?.uid]);

  useEffect(() => {
    async function fetchDetails() {
      if (!id || !type) return;

      setIsLoading(true);
      setError(null);

      try {
        if (type === 'movie') {
          const data = await getMovieDetails(Number(id));
          setMedia(transformMovieDetails(data));
        } else {
          const data = await getTVDetails(Number(id));
          setMedia(transformTVDetails(data));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch details'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [id, type]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Skeleton width={SCREEN_WIDTH} height={BACKDROP_HEIGHT} borderRadius={0} />
        <View style={styles.loadingContent}>
          <Skeleton width="70%" height={28} borderRadius={borderRadius.md} />
          <Skeleton width="50%" height={18} borderRadius={borderRadius.sm} style={{ marginTop: spacing.sm }} />
          <Skeleton width="100%" height={80} borderRadius={borderRadius.md} style={{ marginTop: spacing.xl }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Skeleton width={70} height={70} borderRadius={borderRadius.lg} />
            <Skeleton width={SCREEN_WIDTH - 70 - spacing.screenPadding * 2 - spacing.sm} height={48} borderRadius={borderRadius.md} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !media) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
          </View>
          <Text variant="h4" align="center" style={{ marginTop: spacing.md }}>
            Something went wrong
          </Text>
          <Text variant="body" color="secondary" align="center">
            {error?.message || 'Failed to load details'}
          </Text>
          <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const backdropUrl = getBackdropUrl(media.backdropPath, 'large');
  const director = media.credits.crew.find((c) => c.job === 'Director');
  const topCast = media.credits.cast.slice(0, 10);
  const trailer = media.videos.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const toBasicMedia = (): Media => ({
    id: media.id,
    type: media.type,
    title: media.title,
    posterPath: media.posterPath,
    backdropPath: media.backdropPath,
    overview: media.overview,
    releaseDate: '',
    releaseYear: media.releaseYear,
    rating: media.rating,
    voteCount: media.voteCount,
    genreIds: media.genres.map((g) => g.id),
    popularity: 0,
  });

  const handleWatchlistToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (inWatchlist) {
      removeItem(media.id);
    } else {
      addItem(toBasicMedia(), 'solo');
    }
  };

  const handleMarkWatched = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleWatched(media.id);
  };

  const handleWatchTrailer = () => {
    if (trailer) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Backdrop with enhanced gradient */}
        <View style={styles.backdropContainer}>
          <Image source={{ uri: backdropUrl || undefined }} style={styles.backdrop} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', theme.colors.background.primary]}
            locations={[0, 0.6, 1]}
            style={styles.backdropGradient}
          />

          {/* Close Button with blur */}
          <Pressable
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <BlurView intensity={30} tint="dark" style={styles.blurButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </BlurView>
          </Pressable>

          {/* Type Badge */}
          <View style={styles.typeBadgeContainer}>
            <BlurView intensity={40} tint="dark" style={styles.typeBadge}>
              <Ionicons
                name={media.type === 'movie' ? 'film' : 'tv'}
                size={14}
                color="#FFF"
              />
              <Text variant="caption" style={{ color: '#FFF', fontWeight: '600' }}>
                {media.type === 'movie' ? 'Movie' : 'TV Series'}
              </Text>
            </BlurView>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* AI Recommendation Badge */}
          {explanation && (
            <LinearGradient
              colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.explanationBadge}
            >
              <Ionicons name="sparkles" size={14} color="#FFF" />
              <Text variant="caption" style={{ color: '#FFF', fontWeight: '600' }}>
                {explanation}
              </Text>
            </LinearGradient>
          )}

          {/* Title */}
          <Text variant="h1" style={styles.title}>{media.title}</Text>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
              <Text variant="body" color="secondary">{media.releaseYear}</Text>
            </View>
            <View style={[styles.metaDot, { backgroundColor: theme.colors.text.tertiary }]} />
            {media.type === 'movie' ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={theme.colors.text.tertiary} />
                <Text variant="body" color="secondary">
                  {formatRuntime((media as MovieDetails).runtime)}
                </Text>
              </View>
            ) : (
              <View style={styles.metaItem}>
                <Ionicons name="layers-outline" size={14} color={theme.colors.text.tertiary} />
                <Text variant="body" color="secondary">
                  {(media as TVDetails).numberOfSeasons} Season{(media as TVDetails).numberOfSeasons > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Rating Card */}
          <View style={[styles.ratingCard, { backgroundColor: theme.colors.background.secondary }]}>
            <View style={styles.ratingMain}>
              <Ionicons name="star" size={28} color={getRatingColor(media.rating)} />
              <Text variant="display2" style={{ color: getRatingColor(media.rating), fontWeight: '700' }}>
                {media.rating.toFixed(1)}
              </Text>
              <Text variant="body" color="tertiary" style={{ marginLeft: spacing.xs }}>
                / 10
              </Text>
            </View>
            <Text variant="caption" color="tertiary">
              {media.voteCount.toLocaleString()} ratings
            </Text>
          </View>

          {/* Genres */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.genreScroll}
            contentContainerStyle={styles.genreRow}
          >
            {media.genres.map((genre) => (
              <Chip key={genre.id} label={genre.name} />
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.actionRow}>
              {/* Dislike Button */}
              <Pressable
                onPress={handleDislike}
                style={({ pressed }) => [
                  styles.likeButton,
                  {
                    backgroundColor: isDisliked
                      ? theme.colors.accent.nope + '20'
                      : theme.colors.background.secondary,
                    borderColor: isDisliked ? theme.colors.accent.nope : theme.colors.border.subtle,
                  },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                ]}
              >
                <Ionicons
                  name={isDisliked ? 'close-circle' : 'close-circle-outline'}
                  size={26}
                  color={isDisliked ? theme.colors.accent.nope : theme.colors.text.primary}
                />
                <Text
                  variant="caption"
                  style={{
                    marginTop: 4,
                    fontWeight: '600',
                    color: isDisliked ? theme.colors.accent.nope : theme.colors.text.secondary,
                  }}
                >
                  {isDisliked ? 'Nope' : 'Pass'}
                </Text>
              </Pressable>

              {/* Like Button */}
              <Pressable
                onPress={handleLike}
                style={({ pressed }) => [
                  styles.likeButton,
                  {
                    backgroundColor: isLiked
                      ? theme.colors.accent.like + '20'
                      : theme.colors.background.secondary,
                    borderColor: isLiked ? theme.colors.accent.like : theme.colors.border.subtle,
                  },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                ]}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isLiked ? theme.colors.accent.like : theme.colors.text.primary}
                />
                <Text
                  variant="caption"
                  style={{
                    marginTop: 4,
                    fontWeight: '600',
                    color: isLiked ? theme.colors.accent.like : theme.colors.text.secondary,
                  }}
                >
                  {isLiked ? 'Liked' : 'Like'}
                </Text>
              </Pressable>

              {/* Watchlist Button */}
              <Button
                style={{ flex: 1, height: 70 }}
                leftIcon={inWatchlist ? 'bookmark' : 'bookmark-outline'}
                variant={inWatchlist ? 'secondary' : 'primary'}
                onPress={handleWatchlistToggle}
              >
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
            </View>

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              {inWatchlist && (
                <Pressable
                  onPress={handleMarkWatched}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: watchlistItem?.watched
                        ? theme.colors.accent.like + '15'
                        : theme.colors.background.secondary,
                      borderColor: watchlistItem?.watched
                        ? theme.colors.accent.like + '40'
                        : theme.colors.border.subtle,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons
                    name={watchlistItem?.watched ? 'checkmark-circle' : 'eye-outline'}
                    size={20}
                    color={watchlistItem?.watched ? theme.colors.accent.like : theme.colors.text.secondary}
                  />
                  <Text
                    variant="body"
                    style={{
                      fontWeight: '500',
                      color: watchlistItem?.watched ? theme.colors.accent.like : theme.colors.text.primary,
                    }}
                  >
                    {watchlistItem?.watched ? 'Watched' : 'Mark Watched'}
                  </Text>
                </Pressable>
              )}

              {trailer && (
                <Pressable
                  onPress={handleWatchTrailer}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.colors.background.secondary,
                      borderColor: theme.colors.border.subtle,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons name="play-circle" size={20} color={theme.colors.primary[500]} />
                  <Text variant="body" style={{ fontWeight: '500' }}>
                    Watch Trailer
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={theme.colors.text.tertiary} />
              <Text variant="h4" style={styles.sectionTitle}>Overview</Text>
            </View>
            <Text variant="body" color="secondary" style={styles.overview}>
              {media.overview}
            </Text>
          </View>

          {/* Director */}
          {director && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="videocam-outline" size={18} color={theme.colors.text.tertiary} />
                <Text variant="h4" style={styles.sectionTitle}>Director</Text>
              </View>
              <View style={[styles.directorCard, { backgroundColor: theme.colors.background.secondary }]}>
                <Avatar
                  name={director.name}
                  size="md"
                />
                <Text variant="body" style={{ fontWeight: '500' }}>{director.name}</Text>
              </View>
            </View>
          )}

          {/* Cast */}
          {topCast.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={18} color={theme.colors.text.tertiary} />
                <Text variant="h4" style={styles.sectionTitle}>Cast</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.castList}
              >
                {topCast.map((member) => (
                  <View
                    key={member.id}
                    style={[styles.castItem, { backgroundColor: theme.colors.background.secondary }]}
                  >
                    <Avatar
                      source={getProfileUrl(member.profilePath, 'medium') || undefined}
                      name={member.name}
                      size="lg"
                    />
                    <Text variant="caption" numberOfLines={1} style={styles.castName}>
                      {member.name}
                    </Text>
                    <Text variant="captionSmall" color="tertiary" numberOfLines={1} style={styles.castCharacter}>
                      {member.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: spacing['2xl'] }} />
        </View>
      </ScrollView>
    </View>
  );
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdropContainer: {
    height: BACKDROP_HEIGHT,
    position: 'relative',
  },
  backdrop: {
    width: SCREEN_WIDTH,
    height: BACKDROP_HEIGHT,
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BACKDROP_HEIGHT * 0.7,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: spacing.screenPadding,
  },
  blurButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  typeBadgeContainer: {
    position: 'absolute',
    top: 50,
    right: spacing.screenPadding,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: -spacing['2xl'],
  },
  explanationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '700',
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  ratingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  ratingMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  genreScroll: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.screenPadding,
  },
  genreRow: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  overview: {
    lineHeight: 24,
  },
  directorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  castList: {
    gap: spacing.md,
  },
  castItem: {
    width: 100,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  castName: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  castCharacter: {
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContent: {
    padding: spacing.screenPadding,
    marginTop: -spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
