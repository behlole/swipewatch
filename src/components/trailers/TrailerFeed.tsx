import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ViewToken,
  AppState,
  AppStateStatus,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Text } from '../ui';
import { useTheme, spacing } from '../../theme';
import { getPopularMovies, getTrending, getMovieDetails, getPosterUrl } from '../../services/tmdb';
import { useAuthStore } from '../../features/auth/stores/authStore';
import { updateTasteProfileFromSwipe, getTasteProfile, getInteractedContentIds } from '../../services/firebase/tasteProfile';
import { clearRecommendationCache } from '../../hooks/useRecommendations';
import { Image } from 'expo-image';

// Minimum watch time in ms before considering it a "viewed" trailer
const MIN_VIEW_DURATION_MS = 3000;

// Match tab bar height from app/(tabs)/_layout.tsx so content doesn't sit under it
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

interface TrailerItem {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number;
  rating: number;
  genreIds: number[];
  trailerKey: string | null;
  popularity: number;
}

interface TrailerFeedProps {
  onClose?: () => void;
}

// Cache for trailer data
const trailerCache: Map<number, TrailerItem> = new Map();

export function TrailerFeed({ onClose }: TrailerFeedProps) {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // When used as tab, reserve space for tab bar; when modal (onClose), use full height
  const contentHeight = onClose
    ? screenHeight
    : Math.max(200, screenHeight - TAB_BAR_HEIGHT);
  const contentWidth = screenWidth;
  const isLandscape = screenWidth > screenHeight;
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [trailers, setTrailers] = useState<TrailerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playAfterReady, setPlayAfterReady] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const loadedMovieIds = useRef<Set<number>>(new Set());
  const viewStartTime = useRef<number>(Date.now());
  const processedSkips = useRef<Set<number>>(new Set());
  const previouslyInteractedIds = useRef<Set<number>>(new Set());

  // Fetch previously interacted IDs from taste profile on mount
  useEffect(() => {
    async function fetchInteractedIds() {
      if (!firebaseUser?.uid) return;
      try {
        const profile = await getTasteProfile(firebaseUser.uid);
        previouslyInteractedIds.current = getInteractedContentIds(profile);
        // Also mark these in loadedMovieIds to prevent loading them
        previouslyInteractedIds.current.forEach(id => loadedMovieIds.current.add(id));
      } catch (err) {
        console.warn('Failed to fetch interacted IDs:', err);
      }
    }
    fetchInteractedIds();
  }, [firebaseUser?.uid]);

  // Track when video starts playing
  useEffect(() => {
    viewStartTime.current = Date.now();
  }, [currentIndex]);

  // Reel-style: only send play after iframe is ready; reset when changing slide
  useEffect(() => {
    setPlayAfterReady(false);
    const fallback = setTimeout(() => setPlayAfterReady(true), 1500);
    return () => clearTimeout(fallback);
  }, [currentIndex]);

  // Process skipped video (scrolled past without liking)
  const processSkippedVideo = useCallback(async (item: TrailerItem, viewDurationMs: number) => {
    // Don't process if already liked, already processed, or viewed too briefly
    if (likedIds.has(item.id) || processedSkips.current.has(item.id) || viewDurationMs < MIN_VIEW_DURATION_MS) {
      return;
    }

    processedSkips.current.add(item.id);

    if (firebaseUser?.uid) {
      try {
        await updateTasteProfileFromSwipe(firebaseUser.uid, {
          direction: 'left', // Skipped = implicit dislike
          features: {
            genreIds: item.genreIds,
            primaryGenre: item.genreIds[0],
          },
          contentSnapshot: {
            voteAverage: item.rating,
            releaseYear: item.releaseYear,
            popularity: item.popularity,
          },
          engagement: {
            viewDurationMs,
          },
          contentId: item.id,
        });
        // Clear recommendation cache so For You updates with new signal
        clearRecommendationCache();
      } catch (err) {
        console.warn('Failed to record skip:', err);
      }
    }
  }, [likedIds, firebaseUser?.uid]);

  // Load trailers on mount
  useEffect(() => {
    loadTrailers(1, true);
  }, []);

  // Handle screen focus - pause/play when navigating away/back
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // Handle app state - pause when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsScreenFocused(nextAppState === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, []);

  const loadTrailers = async (page: number = 1, isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Alternate between popular and trending for variety
      const response = page % 2 === 1
        ? await getPopularMovies(Math.ceil(page / 2))
        : await getTrending('movie', 'week');

      const newTrailers: TrailerItem[] = [];

      // Fetch details for each movie to get trailers (in parallel for speed)
      // Filter out already loaded, liked, disliked, and previously interacted movies
      const isExcluded = (id: number) =>
        loadedMovieIds.current.has(id) ||
        likedIds.has(id) ||
        dislikedIds.has(id) ||
        previouslyInteractedIds.current.has(id);

      const moviePromises = response.results
        .filter((movie: any) => !isExcluded(movie.id))
        .slice(0, 10)
        .map(async (movie: any) => {
          // Check cache first
          if (trailerCache.has(movie.id)) {
            return trailerCache.get(movie.id)!;
          }

          try {
            const details = await getMovieDetails(movie.id);
            const trailer = details.videos?.results.find(
              (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            );

            if (trailer) {
              const trailerItem: TrailerItem = {
                id: movie.id,
                title: movie.title,
                overview: movie.overview,
                posterPath: movie.poster_path,
                backdropPath: movie.backdrop_path,
                releaseYear: new Date(movie.release_date || '').getFullYear(),
                rating: movie.vote_average,
                genreIds: movie.genre_ids || [],
                trailerKey: trailer.key,
                popularity: movie.popularity,
              };
              // Cache the trailer
              trailerCache.set(movie.id, trailerItem);
              loadedMovieIds.current.add(movie.id);
              return trailerItem;
            }
          } catch (err) {
            console.warn('Failed to fetch movie details:', err);
          }
          return null;
        });

      const results = await Promise.all(moviePromises);
      newTrailers.push(...results.filter((t): t is TrailerItem => t !== null));

      if (isInitial) {
        setTrailers(newTrailers);
      } else {
        setTrailers(prev => [...prev, ...newTrailers]);
      }

      setCurrentPage(page);
      setHasMorePages(response.total_pages > page && newTrailers.length > 0);
    } catch (error) {
      console.warn('Failed to load trailers:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreTrailers = useCallback(() => {
    if (!isLoadingMore && hasMorePages) {
      loadTrailers(currentPage + 1, false);
    }
  }, [isLoadingMore, hasMorePages, currentPage]);

  const handleLike = useCallback(async (item: TrailerItem) => {
    const viewDurationMs = Date.now() - viewStartTime.current;

    if (likedIds.has(item.id)) {
      // Unlike
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } else {
      // Like
      setLikedIds((prev) => new Set(prev).add(item.id));
      setDislikedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });

      // Remove from processed skips since user actually liked it
      processedSkips.current.delete(item.id);

      // Save to taste profile with full engagement data
      if (firebaseUser?.uid) {
        try {
          await updateTasteProfileFromSwipe(firebaseUser.uid, {
            direction: 'right', // Like
            features: {
              genreIds: item.genreIds,
              primaryGenre: item.genreIds[0],
            },
            contentSnapshot: {
              voteAverage: item.rating,
              releaseYear: item.releaseYear,
              popularity: item.popularity,
            },
            engagement: {
              viewDurationMs,
            },
            contentId: item.id,
          });
          // Clear recommendation cache so For You updates with new likes
          clearRecommendationCache();
        } catch (err) {
          console.warn('Failed to save like:', err);
        }
      }
    }
  }, [likedIds, firebaseUser?.uid]);

  const handleDislike = useCallback(async (item: TrailerItem) => {
    const viewDurationMs = Date.now() - viewStartTime.current;

    if (dislikedIds.has(item.id)) {
      // Un-dislike
      setDislikedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } else {
      // Dislike
      setDislikedIds((prev) => new Set(prev).add(item.id));
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });

      // Mark as processed so skip doesn't double-count
      processedSkips.current.add(item.id);

      // Save explicit dislike to taste profile
      if (firebaseUser?.uid) {
        try {
          await updateTasteProfileFromSwipe(firebaseUser.uid, {
            direction: 'left', // Explicit dislike
            features: {
              genreIds: item.genreIds,
              primaryGenre: item.genreIds[0],
            },
            contentSnapshot: {
              voteAverage: item.rating,
              releaseYear: item.releaseYear,
              popularity: item.popularity,
            },
            engagement: {
              viewDurationMs,
            },
            contentId: item.id,
          });
          // Clear recommendation cache so For You updates
          clearRecommendationCache();
        } catch (err) {
          console.warn('Failed to save dislike:', err);
        }
      }
    }
  }, [dislikedIds, firebaseUser?.uid]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;

      // If scrolling to next video, check if previous was skipped
      if (newIndex !== currentIndex && trailers[currentIndex]) {
        const viewDurationMs = Date.now() - viewStartTime.current;
        const previousItem = trailers[currentIndex];

        // Process the skipped video (only if not liked)
        if (!likedIds.has(previousItem.id)) {
          processSkippedVideo(previousItem, viewDurationMs);
        }
      }

      setCurrentIndex(newIndex);
    }
  }, [currentIndex, trailers, likedIds, processSkippedVideo]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const bottomInset = onClose ? spacing.lg : TAB_BAR_HEIGHT + spacing.md;

  const renderItem = useCallback(({ item, index }: { item: TrailerItem; index: number }) => {
    const isCurrentItem = index === currentIndex;
    const shouldPlay = isCurrentItem && isScreenFocused && playAfterReady;
    const isLiked = likedIds.has(item.id);
    const isDisliked = dislikedIds.has(item.id);

    // Use content area for dimensions; enforce minimum 200px (YouTube iframe requirement)
    const rawHeight = Math.min(contentHeight * 0.85, contentWidth * (9 / 16));
    const playerHeight = Math.max(200, rawHeight);
    const playerWidth = playerHeight * (16 / 9);
    const isInLandscape = contentWidth > contentHeight;

    return (
      <View style={[styles.itemContainer, { width: contentWidth, height: contentHeight }]}>
        {/* Background poster as fallback */}
        {item.posterPath && (
          <Image
            source={{ uri: getPosterUrl(item.posterPath, 'large') || '' }}
            style={styles.backgroundPoster}
            contentFit="cover"
            blurRadius={20}
          />
        )}

        {/* Reel-style: only mount YouTube player for the current item so it can autoplay */}
        <View style={[
          styles.playerContainer,
          {
            top: contentHeight * 0.04,
            left: isInLandscape ? (contentWidth - playerWidth) / 2 : 0,
          }
        ]}>
          {item.trailerKey && isCurrentItem ? (
            <YoutubePlayer
              key={`${item.trailerKey}-${currentIndex}`}
              height={Math.round(playerHeight)}
              width={Math.round(isInLandscape ? playerWidth : contentWidth)}
              videoId={item.trailerKey}
              play={shouldPlay}
              mute={isMuted}
              forceAndroidAutoplay={true}
              onReady={() => setPlayAfterReady(true)}
              onChangeState={(state: string) => {
                // Handle video state changes if needed
              }}
              webViewProps={{
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
              }}
              initialPlayerParams={{
                controls: false,
                modestbranding: true,
                rel: false,
              }}
            />
          ) : item.trailerKey ? (
            <View style={[styles.posterPlaceholder, { width: Math.round(isInLandscape ? playerWidth : contentWidth), height: Math.round(playerHeight) }]}>
              <Image
                source={{ uri: getPosterUrl(item.posterPath, 'medium') || '' }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <View style={styles.posterPlayIcon}>
                <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          ) : null}
        </View>

        {/* Gradient overlay on sides for landscape */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.15, y: 0 }}
          style={styles.leftGradient}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          start={{ x: 0.85, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightGradient}
        />

        {/* Movie Info - left side, above tab bar */}
        <View style={[
          styles.infoContainerLandscape,
          { bottom: bottomInset, left: spacing.lg }
        ]}>
          <Text variant="h3" numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="caption" color="secondary">
              {item.releaseYear}
            </Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={theme.colors.warning} />
              <Text variant="caption" style={{ marginLeft: 4 }}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mute / Unmute - above player */}
        <Pressable
          onPress={() => setIsMuted((m) => !m)}
          style={[styles.muteButton, { top: contentHeight * 0.04 + spacing.sm }]}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={24}
            color="#FFF"
          />
        </Pressable>

        {/* Action buttons - above tab bar */}
        <View style={[styles.actionsContainerLandscape, { bottom: bottomInset }]}>
          {/* Like button */}
          <Pressable
            onPress={() => handleLike(item)}
            style={[
              styles.actionButton,
              isLiked && { backgroundColor: theme.colors.success + '30' },
            ]}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={isLiked ? theme.colors.success : '#FFF'}
            />
            <Text variant="caption" style={styles.actionLabel}>
              Like
            </Text>
          </Pressable>

          {/* Dislike button */}
          <Pressable
            onPress={() => handleDislike(item)}
            style={[
              styles.actionButton,
              isDisliked && { backgroundColor: theme.colors.error + '30' },
            ]}
          >
            <Ionicons
              name={isDisliked ? 'close-circle' : 'close-circle-outline'}
              size={28}
              color={isDisliked ? theme.colors.error : '#FFF'}
            />
            <Text variant="caption" style={styles.actionLabel}>
              Not for me
            </Text>
          </Pressable>

          {/* Add to watchlist */}
          <Pressable style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={28} color="#FFF" />
            <Text variant="caption" style={styles.actionLabel}>
              Save
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }, [currentIndex, isScreenFocused, isMuted, playAfterReady, likedIds, dislikedIds, handleLike, handleDislike, theme, contentWidth, contentHeight, bottomInset]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
          Loading trailers...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Close button */}
      {onClose && (
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>
        </SafeAreaView>
      )}

      <FlatList
        ref={flatListRef}
        data={trailers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: contentHeight,
          offset: contentHeight * index,
          index,
        })}
        onEndReached={loadMoreTrailers}
        onEndReachedThreshold={2}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={[styles.loadingMore, { height: contentHeight }]}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Text variant="caption" color="secondary" style={{ marginTop: spacing.sm }}>
                Loading more trailers...
              </Text>
            </View>
          ) : null
        }
      />

      {/* Swipe hint for first trailer - above tab bar */}
      {currentIndex === 0 && trailers.length > 1 && (
        <View style={[styles.swipeHint, { bottom: bottomInset + spacing.md }]}>
          <Ionicons name="chevron-down" size={24} color="rgba(255,255,255,0.5)" />
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Swipe for more
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    backgroundColor: '#000',
  },
  backgroundPoster: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  playerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  posterPlaceholder: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlayIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '20%',
  },
  rightGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '20%',
  },
  infoContainerLandscape: {
    position: 'absolute',
    maxWidth: '30%',
  },
  title: {
    color: '#FFF',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overview: {
    lineHeight: 20,
  },
  actionsContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: 120,
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionsContainerLandscape: {
    position: 'absolute',
    flexDirection: 'row',
    right: spacing.lg,
    gap: spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
  },
  actionLabel: {
    color: '#FFF',
    marginTop: 4,
    fontSize: 10,
  },
  swipeHint: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

export default TrailerFeed;
