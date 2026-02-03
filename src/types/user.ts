import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  providers: AuthProvider[];
  preferences: UserPreferences;
  stats: UserStats;
  hasCompletedOnboarding: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}

export type AuthProvider = 'email' | 'google.com' | 'apple.com';

export interface UserPreferences {
  genres: number[];
  contentTypes: ContentType[];
  minRating: number;
  includeAdult: boolean;
  regions: string[];
}

export type ContentType = 'movie' | 'tv';

export interface UserStats {
  totalSwipes: number;
  totalLikes: number;
  totalWatchlistItems: number;
  groupsJoined: number;
}

export const defaultUserPreferences: UserPreferences = {
  genres: [],
  contentTypes: ['movie', 'tv'],
  minRating: 6,
  includeAdult: false,
  regions: ['US'],
};

export const defaultUserStats: UserStats = {
  totalSwipes: 0,
  totalLikes: 0,
  totalWatchlistItems: 0,
  groupsJoined: 0,
};
