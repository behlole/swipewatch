import { create } from 'zustand';
import { Media, SwipeDirection } from '../../../types';
import { SwipeEngagement } from '../../../types/recommendations';

export interface SwipeHistory {
  media: Media;
  direction: SwipeDirection;
  engagement?: SwipeEngagement;
  timestamp: Date;
}

/** Unique key so movie 123 and tv 123 are tracked separately */
export function swipeKey(media: { id: number; type: string }): string {
  return `${media.type}-${media.id}`;
}

interface SwipeState {
  // Current session
  mode: 'solo' | 'group';
  groupId: string | null;

  // Tracking by "type-id" so the same card never reappears
  swipedKeys: Set<string>;
  swipeHistory: SwipeHistory[];
  currentFilters: SwipeFilters;

  // Actions
  setMode: (mode: 'solo' | 'group', groupId?: string) => void;
  addSwipe: (media: Media, direction: SwipeDirection, engagement?: SwipeEngagement) => void;
  undoLastSwipe: () => SwipeHistory | null;
  setFilters: (filters: Partial<SwipeFilters>) => void;
  resetSession: () => void;
  hasBeenSwiped: (id: number, type?: string) => boolean;
  getRecentSwipes: (limit?: number) => SwipeHistory[];
}

export interface SwipeFilters {
  contentType: 'movie' | 'tv' | 'both';
  genres: number[];
  minRating: number;
  minYear: number;
  maxYear: number;
}

const defaultFilters: SwipeFilters = {
  contentType: 'movie',
  genres: [],
  minRating: 6,
  minYear: 2000,
  maxYear: new Date().getFullYear(),
};

export const useSwipeStore = create<SwipeState>((set, get) => ({
  mode: 'solo',
  groupId: null,
  swipedKeys: new Set(),
  swipeHistory: [],
  currentFilters: defaultFilters,

  setMode: (mode, groupId) => set({ mode, groupId }),

  addSwipe: (media, direction, engagement) =>
    set((state) => ({
      swipedKeys: new Set([...state.swipedKeys, swipeKey(media)]),
      swipeHistory: [
        ...state.swipeHistory,
        { media, direction, engagement, timestamp: new Date() },
      ],
    })),

  undoLastSwipe: () => {
    const state = get();
    if (state.swipeHistory.length === 0) return null;

    const lastSwipe = state.swipeHistory[state.swipeHistory.length - 1];
    const newSwipedKeys = new Set(state.swipedKeys);
    newSwipedKeys.delete(swipeKey(lastSwipe.media));

    set({
      swipedKeys: newSwipedKeys,
      swipeHistory: state.swipeHistory.slice(0, -1),
    });

    return lastSwipe;
  },

  setFilters: (filters) =>
    set((state) => ({
      currentFilters: { ...state.currentFilters, ...filters },
    })),

  resetSession: () =>
    set({
      swipedKeys: new Set(),
      swipeHistory: [],
    }),

  hasBeenSwiped: (id, type) =>
    type
      ? get().swipedKeys.has(`${type}-${id}`)
      : get().swipedKeys.has(`movie-${id}`) || get().swipedKeys.has(`tv-${id}`),

  getRecentSwipes: (limit = 20) => {
    const state = get();
    return state.swipeHistory.slice(-limit);
  },
}));
