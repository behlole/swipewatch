import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../features/auth/stores/authStore';
import {
  getPersonalizedRecommendations,
  getContentRecommendations,
  getSwipeDeckRecommendations,
  getExplorationRecommendations,
  RecommendationResult,
} from '../services/recommendations';
import { Recommendation } from '../types/recommendations';

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

interface CacheEntry {
  data: RecommendationResult;
  timestamp: number;
}

// Simple in-memory cache
const recommendationCache: Record<string, CacheEntry> = {};

function getCachedResult(key: string): RecommendationResult | null {
  const entry = recommendationCache[key];
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
  if (isExpired) {
    delete recommendationCache[key];
    return null;
  }

  return entry.data;
}

function setCachedResult(key: string, data: RecommendationResult): void {
  recommendationCache[key] = {
    data,
    timestamp: Date.now(),
  };
}

/**
 * Hook for getting personalized "For You" recommendations
 * Auto-refreshes on mount to always show latest
 */
export function useRecommendations(limit: number = 20) {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('low');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fetchingRef = useRef(false);
  const loadedIds = useRef<Set<number>>(new Set());

  const fetchRecommendations = useCallback(
    async (skipCache: boolean = false, pageNum: number = 1, append: boolean = false) => {
      if (!firebaseUser?.uid) {
        setIsLoading(false);
        return;
      }

      // Prevent concurrent fetches
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      const cacheKey = `personalized_${firebaseUser.uid}_${limit}_${pageNum}`;

      // Check cache first (only for initial load, not refresh)
      if (!skipCache && pageNum === 1) {
        const cached = getCachedResult(cacheKey);
        if (cached) {
          setRecommendations(cached.recommendations);
          setConfidence(cached.confidence);
          cached.recommendations.forEach(r => loadedIds.current.add(r.contentId));
          setIsLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        // Fetch more recommendations by increasing limit for pagination effect
        const result = await getPersonalizedRecommendations(firebaseUser.uid, limit * pageNum);

        // Filter out already loaded items
        const newRecs = result.recommendations.filter(r => !loadedIds.current.has(r.contentId));
        newRecs.forEach(r => loadedIds.current.add(r.contentId));

        if (append) {
          setRecommendations(prev => [...prev, ...newRecs]);
        } else {
          loadedIds.current.clear();
          result.recommendations.forEach(r => loadedIds.current.add(r.contentId));
          setRecommendations(result.recommendations);
        }

        setConfidence(result.confidence);
        setHasMore(newRecs.length > 0);
        setPage(pageNum);

        if (!append) {
          setCachedResult(cacheKey, result);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [firebaseUser?.uid, limit]
  );

  // Always fetch fresh on mount
  useEffect(() => {
    fetchRecommendations(true); // Skip cache to get latest
  }, [fetchRecommendations]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchRecommendations(true, page + 1, true);
    }
  }, [fetchRecommendations, isLoadingMore, hasMore, page]);

  return {
    recommendations,
    isLoading,
    isLoadingMore,
    error,
    confidence,
    hasMore,
    refresh: () => fetchRecommendations(true),
    loadMore,
  };
}

/**
 * Hook for getting "More Like This" recommendations
 */
export function useContentRecommendations(
  contentId: number | null,
  contentType: 'movie' | 'tv',
  limit: number = 10
) {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!firebaseUser?.uid || !contentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getContentRecommendations(
        firebaseUser.uid,
        contentId,
        contentType,
        limit
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser?.uid, contentId, contentType, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: fetchRecommendations,
  };
}

/**
 * Hook for getting recommendations for the swipe deck
 */
export function useSwipeDeckRecommendations(limit: number = 50) {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSwipeDeckRecommendations(firebaseUser.uid, limit);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser?.uid, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: fetchRecommendations,
  };
}

/**
 * Hook for getting exploration/discovery recommendations
 */
export function useExplorationRecommendations(limit: number = 10) {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getExplorationRecommendations(firebaseUser.uid, limit);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser?.uid, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: fetchRecommendations,
  };
}

/**
 * Clear the recommendation cache (call after significant swipe activity)
 */
export function clearRecommendationCache(): void {
  Object.keys(recommendationCache).forEach((key) => {
    delete recommendationCache[key];
  });
}
