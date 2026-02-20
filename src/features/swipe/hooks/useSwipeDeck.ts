import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSwipeStore, SwipeFilters } from '../stores/swipeStore';
import { useWatchlistStore } from '../../watchlist/stores/watchlistStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { discoverMovies, discoverTV, transformMovie, transformTVShow } from '../../../services/tmdb';
import { recordEnhancedSwipe } from '../../../services/firebase/firestore';
import { getSwipeDeckRecommendations } from '../../../services/recommendations';
import { getTasteProfile, getInteractedContentIds } from '../../../services/firebase/tasteProfile';
import { Media, SwipeDirection } from '../../../types';
import { SwipeEngagement, createDefaultEngagement, Recommendation } from '../../../types/recommendations';

const PREFETCH_THRESHOLD = 5;
const PAGE_SIZE = 20;
const PERSONALIZED_RATIO = 0.3; // 30% personalized content mixed in

interface UseSwipeDeckOptions {
  filters?: Partial<SwipeFilters>;
  usePersonalization?: boolean; // Enable AI-powered personalization
}

/**
 * Convert a Recommendation to Media format
 */
function recommendationToMedia(rec: Recommendation): Media {
  return {
    id: rec.contentId,
    type: rec.contentType,
    title: rec.title,
    overview: '', // Not available in recommendation
    posterPath: rec.posterPath || null,
    backdropPath: null,
    releaseYear: rec.releaseYear,
    rating: rec.voteAverage,
    voteCount: 0,
    genreIds: rec.genreIds,
    popularity: 0,
    originalLanguage: 'en',
  };
}

export function useSwipeDeck(options: UseSwipeDeckOptions = {}) {
  const {
    swipedIds,
    currentFilters,
    addSwipe,
    undoLastSwipe,
    hasBeenSwiped,
  } = useSwipeStore();
  const { addItem: addToWatchlist, isInWatchlist } = useWatchlistStore();
  const firebaseUser = useAuthStore((state) => state.firebaseUser);

  const [allItems, setAllItems] = useState<Media[]>([]);
  const [personalizedItems, setPersonalizedItems] = useState<Media[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const personalizedFetchedRef = useRef(false);
  const [interactedIds, setInteractedIds] = useState<Set<number>>(new Set());

  // Fetch interacted content IDs from taste profile
  useEffect(() => {
    async function fetchInteractedIds() {
      if (!firebaseUser?.uid) return;
      try {
        const profile = await getTasteProfile(firebaseUser.uid);
        setInteractedIds(getInteractedContentIds(profile));
      } catch (err) {
        console.warn('Failed to fetch interacted IDs:', err);
      }
    }
    fetchInteractedIds();
  }, [firebaseUser?.uid]);

  const mergedFilters = useMemo(
    () => ({ ...currentFilters, ...options.filters }),
    [currentFilters, options.filters]
  );

  const usePersonalization = options.usePersonalization ?? true;

  // Fetch personalized recommendations (once per session)
  const fetchPersonalized = useCallback(async () => {
    if (!firebaseUser?.uid || !usePersonalization || personalizedFetchedRef.current) {
      return;
    }

    try {
      personalizedFetchedRef.current = true;
      const recommendations = await getSwipeDeckRecommendations(firebaseUser.uid, 20);
      const personalizedMedia = recommendations.map(recommendationToMedia);
      setPersonalizedItems(personalizedMedia);
    } catch (err) {
      console.warn('Failed to fetch personalized recommendations:', err);
    }
  }, [firebaseUser?.uid, usePersonalization]);

  // Fetch personalized on mount
  useEffect(() => {
    fetchPersonalized();
  }, [fetchPersonalized]);

  // Filter out already swiped items and previously interacted items
  const availableItems = useMemo(() => {
    const isExcluded = (id: number) => hasBeenSwiped(id) || interactedIds.has(id);
    const discoveryItems = allItems.filter((item) => !isExcluded(item.id));
    const availablePersonalized = personalizedItems.filter((item) => !isExcluded(item.id));

    if (availablePersonalized.length === 0) {
      return discoveryItems;
    }

    // Mix personalized content throughout the deck
    const mixed: Media[] = [];
    const personalizedInterval = Math.ceil(1 / PERSONALIZED_RATIO); // Insert every N items
    let pIndex = 0;
    let dIndex = 0;

    while (dIndex < discoveryItems.length || pIndex < availablePersonalized.length) {
      // Add discovery items
      for (let i = 0; i < personalizedInterval - 1 && dIndex < discoveryItems.length; i++) {
        mixed.push(discoveryItems[dIndex++]);
      }

      // Add a personalized item
      if (pIndex < availablePersonalized.length) {
        // Avoid duplicates
        const pItem = availablePersonalized[pIndex++];
        if (!mixed.some(m => m.id === pItem.id)) {
          mixed.push(pItem);
        }
      }
    }

    return mixed;
  }, [allItems, personalizedItems, swipedIds, interactedIds, hasBeenSwiped]);

  // Fetch movies/TV shows (returns promise for prefetch coordination)
  const fetchItems = useCallback(
    async (page: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          page,
          'vote_average.gte': mergedFilters.minRating,
          'vote_count.gte': 100,
          with_genres: mergedFilters.genres.length > 0
            ? mergedFilters.genres.join(',')
            : undefined,
          [`${mergedFilters.contentType === 'tv' ? 'first_air_date' : 'primary_release_date'}.gte`]:
            `${mergedFilters.minYear}-01-01`,
          [`${mergedFilters.contentType === 'tv' ? 'first_air_date' : 'primary_release_date'}.lte`]:
            `${mergedFilters.maxYear}-12-31`,
        };

        let results: Media[] = [];
        let maxPages = 1;

        if (mergedFilters.contentType === 'movie' || mergedFilters.contentType === 'both') {
          const movieResponse = await discoverMovies(params);
          results = [...results, ...movieResponse.results.map(transformMovie)];
          maxPages = Math.max(maxPages, movieResponse.total_pages);
        }

        if (mergedFilters.contentType === 'tv' || mergedFilters.contentType === 'both') {
          const tvResponse = await discoverTV(params);
          results = [...results, ...tvResponse.results.map(transformTVShow)];
          maxPages = Math.max(maxPages, tvResponse.total_pages);
        }

        setTotalPages(maxPages);

        // Filter out items without posters
        results = results.filter((item) => item.posterPath);

        // Shuffle if combining both types
        if (mergedFilters.contentType === 'both') {
          results = shuffleArray(results);
        }

        if (page === 1) {
          setAllItems(results);
        } else {
          setAllItems((prev) => [...prev, ...results]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch content'));
      } finally {
        setIsLoading(false);
      }
    },
    [mergedFilters]
  );

  const isFetchingNextPageRef = useRef(false);

  // Initial load when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchItems(1);
  }, [mergedFilters.contentType, mergedFilters.genres.join(','), mergedFilters.minRating, fetchItems]);

  // Prefetch next page when running low (or when cards run out)
  useEffect(() => {
    if (
      availableItems.length > PREFETCH_THRESHOLD ||
      currentPage >= totalPages ||
      isLoading ||
      isFetchingNextPageRef.current
    ) {
      return;
    }
    const nextPage = currentPage + 1;
    isFetchingNextPageRef.current = true;
    setCurrentPage(nextPage);
    fetchItems(nextPage).finally(() => {
      isFetchingNextPageRef.current = false;
    });
  }, [availableItems.length, currentPage, totalPages, isLoading, fetchItems]);

  // Track session position for engagement context
  const sessionPositionRef = useRef(0);

  // Get current user ID for Firebase recording
  const userId = useAuthStore.getState().firebaseUser?.uid;

  // Handle swipe with engagement data
  const handleSwipe = useCallback(
    (media: Media, direction: SwipeDirection, engagement?: SwipeEngagement) => {
      sessionPositionRef.current += 1;

      // Add engagement data with session position
      const enrichedEngagement = engagement || createDefaultEngagement();

      // Add swipe to local store (with engagement for future Firebase sync)
      addSwipe(media, direction, enrichedEngagement);

      // If liked, add to watchlist (syncs to Firebase)
      if (direction === 'right' && !isInWatchlist(media.id)) {
        addToWatchlist(media, 'solo', userId || undefined);
      }

      // Record enhanced swipe to Firebase (async, non-blocking)
      if (userId) {
        recordEnhancedSwipe(
          userId,
          media,
          direction,
          enrichedEngagement,
          sessionPositionRef.current,
          'solo'
        ).catch((error) => {
          console.warn('Failed to record swipe to Firebase:', error);
        });
      }
    },
    [addSwipe, addToWatchlist, isInWatchlist, userId]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    undoLastSwipe();
    // Note: We don't remove from Firebase - just locally
  }, [undoLastSwipe]);

  // Refresh function that also reloads personalized recommendations
  const refresh = useCallback(() => {
    setCurrentPage(1);
    fetchItems(1);
    // Reset personalized fetch flag to allow re-fetching
    personalizedFetchedRef.current = false;
    fetchPersonalized();
  }, [fetchItems, fetchPersonalized]);

  return {
    items: availableItems,
    isLoading,
    error,
    onSwipe: handleSwipe,
    onUndo: handleUndo,
    canUndo: useSwipeStore.getState().swipeHistory.length > 0,
    refresh,
    hasPersonalization: personalizedItems.length > 0,
  };
}

// Utility function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
