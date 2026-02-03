import { useMemo, useCallback } from 'react';
import { useWatchlistStore } from '../stores/watchlistStore';
import { WatchlistItem, Media } from '../../../types';

type SortOption = 'dateAdded' | 'title' | 'rating' | 'year';
type FilterOption = 'all' | 'movie' | 'tv' | 'watched' | 'unwatched';

interface UseWatchlistOptions {
  sortBy?: SortOption;
  filterBy?: FilterOption;
}

export function useWatchlist(options: UseWatchlistOptions = {}) {
  const { sortBy = 'dateAdded', filterBy = 'all' } = options;
  const {
    items,
    addItem,
    removeItem,
    toggleWatched,
    setRating,
    isInWatchlist,
    getItem,
  } = useWatchlistStore();

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      switch (filterBy) {
        case 'movie':
          return item.contentType === 'movie';
        case 'tv':
          return item.contentType === 'tv';
        case 'watched':
          return item.watched;
        case 'unwatched':
          return !item.watched;
        default:
          return true;
      }
    });
  }, [items, filterBy]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.voteAverage - a.voteAverage;
        case 'year':
          return b.releaseYear - a.releaseYear;
        case 'dateAdded':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });
  }, [filteredItems, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const watched = items.filter((i) => i.watched).length;
    const movies = items.filter((i) => i.contentType === 'movie').length;
    const tvShows = items.filter((i) => i.contentType === 'tv').length;

    return { total, watched, unwatched: total - watched, movies, tvShows };
  }, [items]);

  // Convert WatchlistItem to Media for display
  const toMedia = useCallback((item: WatchlistItem): Media => ({
    id: item.contentId,
    type: item.contentType,
    title: item.title,
    posterPath: item.posterPath,
    backdropPath: null,
    overview: item.overview,
    releaseDate: '',
    releaseYear: item.releaseYear,
    rating: item.voteAverage,
    voteCount: 0,
    genreIds: item.genres,
    popularity: 0,
  }), []);

  return {
    items: sortedItems,
    stats,
    addItem,
    removeItem,
    toggleWatched,
    setRating,
    isInWatchlist,
    getItem,
    toMedia,
  };
}
