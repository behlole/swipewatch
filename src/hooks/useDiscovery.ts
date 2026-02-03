import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
  transformMovie,
  transformTVShow,
} from '../services/tmdb';
import { Media } from '../types';

interface DiscoveryData {
  trending: Media[];
  popular: Media[];
  topRated: Media[];
  upcoming: Media[];
  nowPlaying: Media[];
}

interface CategoryState {
  items: Media[];
  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

interface UseDiscoveryReturn extends DiscoveryData {
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  loadMorePopular: () => void;
  loadMoreTopRated: () => void;
  loadMoreUpcoming: () => void;
  loadMoreNowPlaying: () => void;
  isLoadingMorePopular: boolean;
  isLoadingMoreTopRated: boolean;
  isLoadingMoreUpcoming: boolean;
  isLoadingMoreNowPlaying: boolean;
  hasMorePopular: boolean;
  hasMoreTopRated: boolean;
  hasMoreUpcoming: boolean;
  hasMoreNowPlaying: boolean;
}

export function useDiscovery(): UseDiscoveryReturn {
  const [data, setData] = useState<DiscoveryData>({
    trending: [],
    popular: [],
    topRated: [],
    upcoming: [],
    nowPlaying: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Pagination state for each category
  const [popularState, setPopularState] = useState<CategoryState>({
    items: [], page: 1, hasMore: true, isLoadingMore: false,
  });
  const [topRatedState, setTopRatedState] = useState<CategoryState>({
    items: [], page: 1, hasMore: true, isLoadingMore: false,
  });
  const [upcomingState, setUpcomingState] = useState<CategoryState>({
    items: [], page: 1, hasMore: true, isLoadingMore: false,
  });
  const [nowPlayingState, setNowPlayingState] = useState<CategoryState>({
    items: [], page: 1, hasMore: true, isLoadingMore: false,
  });

  // Track loaded IDs to avoid duplicates
  const loadedIds = useRef<{
    popular: Set<number>;
    topRated: Set<number>;
    upcoming: Set<number>;
    nowPlaying: Set<number>;
  }>({
    popular: new Set(),
    topRated: new Set(),
    upcoming: new Set(),
    nowPlaying: new Set(),
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Reset loaded IDs
    loadedIds.current = {
      popular: new Set(),
      topRated: new Set(),
      upcoming: new Set(),
      nowPlaying: new Set(),
    };

    try {
      const [trendingRes, popularRes, topRatedRes, upcomingRes, nowPlayingRes] =
        await Promise.all([
          getTrending('movie', 'week'),
          getPopularMovies(1),
          getTopRatedMovies(1),
          getUpcomingMovies(1),
          getNowPlayingMovies(1),
        ]);

      const trendingItems = trendingRes.results.slice(0, 10).map((item) => {
        if ('title' in item) {
          return transformMovie(item as any);
        }
        return transformTVShow(item as any);
      });

      const popularItems = popularRes.results.map(transformMovie);
      const topRatedItems = topRatedRes.results.map(transformMovie);
      const upcomingItems = upcomingRes.results.map(transformMovie);
      const nowPlayingItems = nowPlayingRes.results.map(transformMovie);

      // Track loaded IDs
      popularItems.forEach(item => loadedIds.current.popular.add(item.id));
      topRatedItems.forEach(item => loadedIds.current.topRated.add(item.id));
      upcomingItems.forEach(item => loadedIds.current.upcoming.add(item.id));
      nowPlayingItems.forEach(item => loadedIds.current.nowPlaying.add(item.id));

      setData({
        trending: trendingItems,
        popular: popularItems,
        topRated: topRatedItems,
        upcoming: upcomingItems,
        nowPlaying: nowPlayingItems,
      });

      // Reset pagination state
      setPopularState({ items: popularItems, page: 1, hasMore: popularRes.total_pages > 1, isLoadingMore: false });
      setTopRatedState({ items: topRatedItems, page: 1, hasMore: topRatedRes.total_pages > 1, isLoadingMore: false });
      setUpcomingState({ items: upcomingItems, page: 1, hasMore: upcomingRes.total_pages > 1, isLoadingMore: false });
      setNowPlayingState({ items: nowPlayingItems, page: 1, hasMore: nowPlayingRes.total_pages > 1, isLoadingMore: false });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch discovery data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more functions for each category
  const loadMorePopular = useCallback(async () => {
    if (popularState.isLoadingMore || !popularState.hasMore) return;

    setPopularState(prev => ({ ...prev, isLoadingMore: true }));
    try {
      const nextPage = popularState.page + 1;
      const response = await getPopularMovies(nextPage);
      const newItems = response.results
        .map(transformMovie)
        .filter(item => !loadedIds.current.popular.has(item.id));

      newItems.forEach(item => loadedIds.current.popular.add(item.id));

      setPopularState(prev => ({
        items: [...prev.items, ...newItems],
        page: nextPage,
        hasMore: nextPage < response.total_pages && newItems.length > 0,
        isLoadingMore: false,
      }));
      setData(prev => ({ ...prev, popular: [...prev.popular, ...newItems] }));
    } catch (err) {
      setPopularState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [popularState.page, popularState.isLoadingMore, popularState.hasMore]);

  const loadMoreTopRated = useCallback(async () => {
    if (topRatedState.isLoadingMore || !topRatedState.hasMore) return;

    setTopRatedState(prev => ({ ...prev, isLoadingMore: true }));
    try {
      const nextPage = topRatedState.page + 1;
      const response = await getTopRatedMovies(nextPage);
      const newItems = response.results
        .map(transformMovie)
        .filter(item => !loadedIds.current.topRated.has(item.id));

      newItems.forEach(item => loadedIds.current.topRated.add(item.id));

      setTopRatedState(prev => ({
        items: [...prev.items, ...newItems],
        page: nextPage,
        hasMore: nextPage < response.total_pages && newItems.length > 0,
        isLoadingMore: false,
      }));
      setData(prev => ({ ...prev, topRated: [...prev.topRated, ...newItems] }));
    } catch (err) {
      setTopRatedState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [topRatedState.page, topRatedState.isLoadingMore, topRatedState.hasMore]);

  const loadMoreUpcoming = useCallback(async () => {
    if (upcomingState.isLoadingMore || !upcomingState.hasMore) return;

    setUpcomingState(prev => ({ ...prev, isLoadingMore: true }));
    try {
      const nextPage = upcomingState.page + 1;
      const response = await getUpcomingMovies(nextPage);
      const newItems = response.results
        .map(transformMovie)
        .filter(item => !loadedIds.current.upcoming.has(item.id));

      newItems.forEach(item => loadedIds.current.upcoming.add(item.id));

      setUpcomingState(prev => ({
        items: [...prev.items, ...newItems],
        page: nextPage,
        hasMore: nextPage < response.total_pages && newItems.length > 0,
        isLoadingMore: false,
      }));
      setData(prev => ({ ...prev, upcoming: [...prev.upcoming, ...newItems] }));
    } catch (err) {
      setUpcomingState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [upcomingState.page, upcomingState.isLoadingMore, upcomingState.hasMore]);

  const loadMoreNowPlaying = useCallback(async () => {
    if (nowPlayingState.isLoadingMore || !nowPlayingState.hasMore) return;

    setNowPlayingState(prev => ({ ...prev, isLoadingMore: true }));
    try {
      const nextPage = nowPlayingState.page + 1;
      const response = await getNowPlayingMovies(nextPage);
      const newItems = response.results
        .map(transformMovie)
        .filter(item => !loadedIds.current.nowPlaying.has(item.id));

      newItems.forEach(item => loadedIds.current.nowPlaying.add(item.id));

      setNowPlayingState(prev => ({
        items: [...prev.items, ...newItems],
        page: nextPage,
        hasMore: nextPage < response.total_pages && newItems.length > 0,
        isLoadingMore: false,
      }));
      setData(prev => ({ ...prev, nowPlaying: [...prev.nowPlaying, ...newItems] }));
    } catch (err) {
      setNowPlayingState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [nowPlayingState.page, nowPlayingState.isLoadingMore, nowPlayingState.hasMore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    isLoading,
    error,
    refresh: fetchData,
    loadMorePopular,
    loadMoreTopRated,
    loadMoreUpcoming,
    loadMoreNowPlaying,
    isLoadingMorePopular: popularState.isLoadingMore,
    isLoadingMoreTopRated: topRatedState.isLoadingMore,
    isLoadingMoreUpcoming: upcomingState.isLoadingMore,
    isLoadingMoreNowPlaying: nowPlayingState.isLoadingMore,
    hasMorePopular: popularState.hasMore,
    hasMoreTopRated: topRatedState.hasMore,
    hasMoreUpcoming: upcomingState.hasMore,
    hasMoreNowPlaying: nowPlayingState.hasMore,
  };
}

// Hook for searching movies with infinite scroll
export function useSearch(query: string) {
  const [results, setResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setPage(1);
      setHasMore(true);
      loadedIds.current.clear();
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      loadedIds.current.clear();

      try {
        const { searchMulti } = await import('../services/tmdb');
        const response = await searchMulti(query, 1);

        const transformed = response.results
          .filter((item) => 'title' in item || 'name' in item)
          .map((item) => {
            if ('title' in item) {
              return transformMovie(item as any);
            }
            return transformTVShow(item as any);
          })
          .filter((item) => item.posterPath);

        transformed.forEach(item => loadedIds.current.add(item.id));
        setResults(transformed);
        setPage(1);
        setHasMore(response.total_pages > 1);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  const loadMore = useCallback(async () => {
    if (!query || query.length < 2 || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { searchMulti } = await import('../services/tmdb');
      const response = await searchMulti(query, nextPage);

      const newItems = response.results
        .filter((item) => 'title' in item || 'name' in item)
        .map((item) => {
          if ('title' in item) {
            return transformMovie(item as any);
          }
          return transformTVShow(item as any);
        })
        .filter((item) => item.posterPath && !loadedIds.current.has(item.id));

      newItems.forEach(item => loadedIds.current.add(item.id));
      setResults(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(nextPage < response.total_pages && newItems.length > 0);
    } catch (err) {
      // Silently fail for load more
    } finally {
      setIsLoadingMore(false);
    }
  }, [query, page, isLoadingMore, hasMore]);

  return { results, isLoading, isLoadingMore, error, loadMore, hasMore };
}
