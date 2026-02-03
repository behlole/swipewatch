import { create } from 'zustand';
import { Media, SwipeDirection } from '../../../types';
import { SwipeEngagement } from '../../../types/recommendations';

export interface SwipeHistory {
  media: Media;
  direction: SwipeDirection;
  engagement?: SwipeEngagement;
  timestamp: Date;
}

interface SwipeState {
  // Current session
  mode: 'solo' | 'group';
  groupId: string | null;

  // Tracking
  swipedIds: Set<number>;
  swipeHistory: SwipeHistory[];
  currentFilters: SwipeFilters;

  // Actions
  setMode: (mode: 'solo' | 'group', groupId?: string) => void;
  addSwipe: (media: Media, direction: SwipeDirection, engagement?: SwipeEngagement) => void;
  undoLastSwipe: () => SwipeHistory | null;
  setFilters: (filters: Partial<SwipeFilters>) => void;
  resetSession: () => void;
  hasBeenSwiped: (id: number) => boolean;
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
  swipedIds: new Set(),
  swipeHistory: [],
  currentFilters: defaultFilters,

  setMode: (mode, groupId) => set({ mode, groupId }),

  addSwipe: (media, direction, engagement) =>
    set((state) => ({
      swipedIds: new Set([...state.swipedIds, media.id]),
      swipeHistory: [
        ...state.swipeHistory,
        { media, direction, engagement, timestamp: new Date() },
      ],
    })),

  undoLastSwipe: () => {
    const state = get();
    if (state.swipeHistory.length === 0) return null;

    const lastSwipe = state.swipeHistory[state.swipeHistory.length - 1];
    const newSwipedIds = new Set(state.swipedIds);
    newSwipedIds.delete(lastSwipe.media.id);

    set({
      swipedIds: newSwipedIds,
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
      swipedIds: new Set(),
      swipeHistory: [],
    }),

  hasBeenSwiped: (id) => get().swipedIds.has(id),

  getRecentSwipes: (limit = 20) => {
    const state = get();
    return state.swipeHistory.slice(-limit);
  },
}));
