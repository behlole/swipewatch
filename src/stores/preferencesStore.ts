import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreamingService {
  id: string;
  name: string;
  logoPath: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

interface PreferencesState {
  // Onboarding
  hasCompletedOnboarding: boolean;

  // Theme
  themeMode: ThemeMode;

  // Content Preferences
  preferredGenres: number[];
  preferredContentType: 'movie' | 'tv' | 'both';
  minRating: number;

  // Streaming Services
  streamingServices: string[]; // Provider IDs

  // Notifications
  notificationsEnabled: boolean;
  newReleasesNotification: boolean;
  watchlistReminders: boolean;
  groupInviteNotification: boolean;

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPreferredGenres: (genres: number[]) => void;
  toggleGenre: (genreId: number) => void;
  setPreferredContentType: (type: 'movie' | 'tv' | 'both') => void;
  setMinRating: (rating: number) => void;
  setStreamingServices: (services: string[]) => void;
  toggleStreamingService: (serviceId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  updateNotificationSettings: (settings: Partial<Pick<PreferencesState, 'newReleasesNotification' | 'watchlistReminders' | 'groupInviteNotification'>>) => void;
  resetPreferences: () => void;
}

const defaultState = {
  hasCompletedOnboarding: false,
  themeMode: 'dark' as ThemeMode,
  preferredGenres: [],
  preferredContentType: 'both' as const,
  minRating: 6,
  streamingServices: [],
  notificationsEnabled: true,
  newReleasesNotification: true,
  watchlistReminders: true,
  groupInviteNotification: true,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setHasCompletedOnboarding: (completed) =>
        set({ hasCompletedOnboarding: completed }),

      setThemeMode: (mode) => set({ themeMode: mode }),

      setPreferredGenres: (genres) => set({ preferredGenres: genres }),

      toggleGenre: (genreId) =>
        set((state) => ({
          preferredGenres: state.preferredGenres.includes(genreId)
            ? state.preferredGenres.filter((g) => g !== genreId)
            : [...state.preferredGenres, genreId],
        })),

      setPreferredContentType: (type) => set({ preferredContentType: type }),

      setMinRating: (rating) => set({ minRating: rating }),

      setStreamingServices: (services) => set({ streamingServices: services }),

      toggleStreamingService: (serviceId) =>
        set((state) => ({
          streamingServices: state.streamingServices.includes(serviceId)
            ? state.streamingServices.filter((s) => s !== serviceId)
            : [...state.streamingServices, serviceId],
        })),

      setNotificationsEnabled: (enabled) =>
        set({ notificationsEnabled: enabled }),

      updateNotificationSettings: (settings) => set(settings),

      resetPreferences: () => set(defaultState),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Popular streaming service providers (TMDB watch provider IDs)
export const STREAMING_SERVICES = [
  { id: '8', name: 'Netflix', logoPath: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: '9', name: 'Amazon Prime Video', logoPath: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { id: '337', name: 'Disney+', logoPath: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
  { id: '384', name: 'HBO Max', logoPath: '/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg' },
  { id: '15', name: 'Hulu', logoPath: '/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg' },
  { id: '350', name: 'Apple TV+', logoPath: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  { id: '531', name: 'Paramount+', logoPath: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg' },
  { id: '387', name: 'Peacock', logoPath: '/8VCV78prwd9QzZnEm0ReO6bERDa.jpg' },
];

// Movie/TV Genres (TMDB genre IDs)
export const GENRES = {
  movie: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ],
  tv: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
  ],
};

// Combined genres for "both" content type
export const ALL_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
];
