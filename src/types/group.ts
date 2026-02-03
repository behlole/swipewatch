import { Timestamp } from 'firebase/firestore';

export interface WatchParty {
  id: string;
  code: string;
  hostId: string;
  status: WatchPartyStatus;
  settings: WatchPartySettings;
  moviePool: string[];
  participants: Record<string, Participant>;
  totalSwipes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}

export type WatchPartyStatus = 'lobby' | 'swiping' | 'results' | 'expired';

export interface WatchPartySettings {
  movieCount: number;
  genres: number[];
  minYear: number;
  maxYear: number;
  minRating: number;
  contentType: 'movie' | 'tv' | 'both';
}

export interface Participant {
  displayName: string;
  photoURL: string | null;
  joinedAt: Timestamp;
  status: ParticipantStatus;
  swipeProgress: number;
  lastSwipeAt?: Timestamp;
  isLateJoiner?: boolean;
}

export type ParticipantStatus = 'active' | 'completed' | 'left' | 'inactive';

export interface GroupSwipe {
  id: string;
  userId: string;
  movieId: string;
  liked: boolean;
  timestamp: Timestamp;
}

export interface GroupMatch {
  id: string;
  movieId: string;
  likedBy: string[];
  likeCount: number;
  isUnanimous: boolean;
  calculatedAt: Timestamp;
  movieSnapshot: {
    title: string;
    posterPath: string;
    releaseYear: number;
    voteAverage: number;
  };
}

export interface SessionInvite {
  code: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  maxUses: number;
  useCount: number;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export const defaultWatchPartySettings: WatchPartySettings = {
  movieCount: 20,
  genres: [],
  minYear: 2000,
  maxYear: new Date().getFullYear(),
  minRating: 6,
  contentType: 'movie',
};
