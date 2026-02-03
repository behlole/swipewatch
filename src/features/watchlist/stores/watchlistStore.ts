import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchlistItem, Media } from '../../../types';
import {
  addToWatchlist as addToFirebase,
  removeFromWatchlist as removeFromFirebase,
  getWatchlist as getFirebaseWatchlist,
  markAsWatched as markAsWatchedFirebase,
} from '../../../services/firebase/firestore';

interface WatchlistState {
  items: WatchlistItem[];
  isSynced: boolean;

  // Actions
  addItem: (media: Media, source?: 'solo' | 'group', userId?: string) => void;
  removeItem: (contentId: number, userId?: string) => void;
  toggleWatched: (contentId: number, userId?: string) => void;
  setRating: (contentId: number, rating: number, userId?: string) => void;
  isInWatchlist: (contentId: number) => boolean;
  getItem: (contentId: number) => WatchlistItem | undefined;
  clearAll: () => void;
  syncFromFirebase: (userId: string) => Promise<void>;
  setItems: (items: WatchlistItem[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isSynced: false,

      addItem: (media, source = 'solo', userId) => {
        const existing = get().items.find((item) => item.contentId === media.id);
        if (existing) return;

        const newItem: WatchlistItem = {
          id: `${media.type}-${media.id}`,
          contentType: media.type,
          contentId: media.id,
          title: media.title,
          posterPath: media.posterPath || '',
          releaseYear: media.releaseYear,
          voteAverage: media.rating,
          genres: media.genreIds,
          overview: media.overview,
          addedAt: new Date(),
          addedFrom: source,
          watched: false,
        };

        set((state) => ({
          items: [newItem, ...state.items],
        }));

        // Sync to Firebase (non-blocking)
        if (userId) {
          addToFirebase(userId, {
            contentType: media.type,
            contentId: media.id,
            title: media.title,
            posterPath: media.posterPath || '',
            releaseYear: media.releaseYear,
            voteAverage: media.rating,
            genres: media.genreIds,
            overview: media.overview,
            addedFrom: source,
            watched: false,
          }).catch((err) => console.warn('Failed to sync watchlist add:', err));
        }
      },

      removeItem: (contentId, userId) => {
        set((state) => ({
          items: state.items.filter((item) => item.contentId !== contentId),
        }));

        // Sync to Firebase (non-blocking)
        if (userId) {
          removeFromFirebase(userId, contentId).catch((err) =>
            console.warn('Failed to sync watchlist remove:', err)
          );
        }
      },

      toggleWatched: (contentId, userId) => {
        const item = get().items.find((i) => i.contentId === contentId);
        const newWatchedState = !item?.watched;

        set((state) => ({
          items: state.items.map((item) =>
            item.contentId === contentId
              ? {
                  ...item,
                  watched: newWatchedState,
                  watchedAt: newWatchedState ? new Date() : undefined,
                }
              : item
          ),
        }));

        // Sync to Firebase (non-blocking)
        if (userId && newWatchedState) {
          markAsWatchedFirebase(userId, contentId).catch((err) =>
            console.warn('Failed to sync watched status:', err)
          );
        }
      },

      setRating: (contentId, rating, userId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.contentId === contentId ? { ...item, userRating: rating } : item
          ),
        }));

        // Sync to Firebase (non-blocking)
        if (userId) {
          markAsWatchedFirebase(userId, contentId, rating).catch((err) =>
            console.warn('Failed to sync rating:', err)
          );
        }
      },

      isInWatchlist: (contentId) => {
        return get().items.some((item) => item.contentId === contentId);
      },

      getItem: (contentId) => {
        return get().items.find((item) => item.contentId === contentId);
      },

      clearAll: () => {
        set({ items: [], isSynced: false });
      },

      syncFromFirebase: async (userId) => {
        try {
          const firebaseItems = await getFirebaseWatchlist(userId);
          // Merge: Firebase items take precedence, but keep local items not in Firebase
          const localItems = get().items;
          const firebaseIds = new Set(firebaseItems.map((i) => i.contentId));
          const localOnlyItems = localItems.filter((i) => !firebaseIds.has(i.contentId));

          set({
            items: [...firebaseItems, ...localOnlyItems],
            isSynced: true,
          });

          // Sync local-only items to Firebase
          for (const item of localOnlyItems) {
            addToFirebase(userId, {
              contentType: item.contentType,
              contentId: item.contentId,
              title: item.title,
              posterPath: item.posterPath,
              releaseYear: item.releaseYear,
              voteAverage: item.voteAverage,
              genres: item.genres,
              overview: item.overview,
              addedFrom: item.addedFrom,
              watched: item.watched,
            }).catch((err) => console.warn('Failed to sync local item:', err));
          }
        } catch (error) {
          console.warn('Failed to sync from Firebase:', error);
        }
      },

      setItems: (items) => {
        set({ items, isSynced: true });
      },
    }),
    {
      name: 'watchlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Handle date serialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.map((item) => ({
            ...item,
            addedAt: new Date(item.addedAt),
            watchedAt: item.watchedAt ? new Date(item.watchedAt) : undefined,
          }));
        }
      },
      partialize: (state) => ({ items: state.items }), // Don't persist isSynced
    }
  )
);
