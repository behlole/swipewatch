import { create } from 'zustand';
import { WatchParty, WatchPartySettings, Participant, GroupMatch, defaultWatchPartySettings } from '../../../types';
import { Media } from '../../../types';

interface GroupState {
  currentSession: WatchParty | null;
  moviePool: Media[];
  currentIndex: number;
  matches: GroupMatch[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: WatchParty | null) => void;
  setMoviePool: (movies: Media[]) => void;
  setCurrentIndex: (index: number) => void;
  addMatch: (match: GroupMatch) => void;
  setMatches: (matches: GroupMatch[]) => void;
  updateParticipant: (userId: string, data: Partial<Participant>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Local session management (for demo without Firebase)
  createLocalSession: (hostId: string, hostName: string, settings: WatchPartySettings) => string;
  joinLocalSession: (code: string, userId: string, userName: string) => boolean;
  startSwiping: () => void;
  recordSwipe: (userId: string, movieId: string, liked: boolean) => void;
  calculateMatches: () => void;
}

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Store active sessions in memory (would be Firebase in production)
const activeSessions = new Map<string, WatchParty>();
const sessionSwipes = new Map<string, Map<string, Map<string, boolean>>>(); // sessionId -> movieId -> userId -> liked

export const useGroupStore = create<GroupState>((set, get) => ({
  currentSession: null,
  moviePool: [],
  currentIndex: 0,
  matches: [],
  isLoading: false,
  error: null,

  setSession: (session) => set({ currentSession: session }),
  setMoviePool: (movies) => set({ moviePool: movies, currentIndex: 0 }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),
  setMatches: (matches) => set({ matches }),
  updateParticipant: (userId, data) => set((state) => {
    if (!state.currentSession) return state;
    return {
      currentSession: {
        ...state.currentSession,
        participants: {
          ...state.currentSession.participants,
          [userId]: { ...state.currentSession.participants[userId], ...data },
        },
      },
    };
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    currentSession: null,
    moviePool: [],
    currentIndex: 0,
    matches: [],
    isLoading: false,
    error: null,
  }),

  createLocalSession: (hostId, hostName, settings) => {
    const code = generateCode();
    const sessionId = generateId();
    const now = new Date();

    const session: WatchParty = {
      id: sessionId,
      code,
      hostId,
      status: 'lobby',
      settings,
      moviePool: [],
      participants: {
        [hostId]: {
          displayName: hostName,
          photoURL: null,
          joinedAt: { toDate: () => now } as any,
          status: 'active',
          swipeProgress: 0,
        },
      },
      totalSwipes: 0,
      createdAt: { toDate: () => now } as any,
      updatedAt: { toDate: () => now } as any,
      expiresAt: { toDate: () => new Date(now.getTime() + 24 * 60 * 60 * 1000) } as any,
    };

    activeSessions.set(code, session);
    sessionSwipes.set(sessionId, new Map());
    set({ currentSession: session });
    return code;
  },

  joinLocalSession: (code, userId, userName) => {
    const session = activeSessions.get(code.toUpperCase());
    if (!session) {
      set({ error: 'Session not found' });
      return false;
    }

    if (session.status !== 'lobby') {
      set({ error: 'Session has already started' });
      return false;
    }

    const now = new Date();
    const updatedSession: WatchParty = {
      ...session,
      participants: {
        ...session.participants,
        [userId]: {
          displayName: userName,
          photoURL: null,
          joinedAt: { toDate: () => now } as any,
          status: 'active',
          swipeProgress: 0,
        },
      },
      updatedAt: { toDate: () => now } as any,
    };

    activeSessions.set(code, updatedSession);
    set({ currentSession: updatedSession, error: null });
    return true;
  },

  startSwiping: () => set((state) => {
    if (!state.currentSession) return state;

    const updatedSession: WatchParty = {
      ...state.currentSession,
      status: 'swiping',
      updatedAt: { toDate: () => new Date() } as any,
    };

    activeSessions.set(state.currentSession.code, updatedSession);
    return { currentSession: updatedSession };
  }),

  recordSwipe: (userId, movieId, liked) => {
    const state = get();
    if (!state.currentSession) return;

    const sessionId = state.currentSession.id;
    let movieSwipes = sessionSwipes.get(sessionId);
    if (!movieSwipes) {
      movieSwipes = new Map();
      sessionSwipes.set(sessionId, movieSwipes);
    }

    let userSwipes = movieSwipes.get(movieId);
    if (!userSwipes) {
      userSwipes = new Map();
      movieSwipes.set(movieId, userSwipes);
    }

    userSwipes.set(userId, liked);

    // Update participant progress
    const participantCount = Object.keys(state.currentSession.participants).length;
    const movieCount = state.moviePool.length;
    const userSwipeCount = Array.from(movieSwipes.values()).filter(m => m.has(userId)).length;
    const progress = Math.round((userSwipeCount / movieCount) * 100);

    set((prev) => {
      if (!prev.currentSession) return prev;
      return {
        currentSession: {
          ...prev.currentSession,
          participants: {
            ...prev.currentSession.participants,
            [userId]: {
              ...prev.currentSession.participants[userId],
              swipeProgress: progress,
              status: progress >= 100 ? 'completed' : 'active',
            },
          },
        },
        currentIndex: prev.currentIndex + 1,
      };
    });

    // Check if all users completed
    const allCompleted = Object.values(get().currentSession?.participants || {})
      .every(p => p.status === 'completed');

    if (allCompleted) {
      get().calculateMatches();
    }
  },

  calculateMatches: () => {
    const state = get();
    if (!state.currentSession) return;

    const sessionId = state.currentSession.id;
    const movieSwipes = sessionSwipes.get(sessionId);
    if (!movieSwipes) return;

    const participantIds = Object.keys(state.currentSession.participants);
    const matches: GroupMatch[] = [];

    state.moviePool.forEach((movie) => {
      const swipes = movieSwipes.get(movie.id.toString());
      if (!swipes) return;

      const likedBy = participantIds.filter(uid => swipes.get(uid) === true);

      if (likedBy.length >= 2) {
        matches.push({
          id: generateId(),
          movieId: movie.id.toString(),
          likedBy,
          likeCount: likedBy.length,
          isUnanimous: likedBy.length === participantIds.length,
          calculatedAt: { toDate: () => new Date() } as any,
          movieSnapshot: {
            title: movie.title,
            posterPath: movie.posterPath || '',
            releaseYear: movie.releaseYear,
            voteAverage: movie.rating,
          },
        });
      }
    });

    // Sort by like count (unanimous first, then by count)
    matches.sort((a, b) => {
      if (a.isUnanimous && !b.isUnanimous) return -1;
      if (!a.isUnanimous && b.isUnanimous) return 1;
      return b.likeCount - a.likeCount;
    });

    const updatedSession: WatchParty = {
      ...state.currentSession,
      status: 'results',
      updatedAt: { toDate: () => new Date() } as any,
    };

    activeSessions.set(state.currentSession.code, updatedSession);
    set({ matches, currentSession: updatedSession });
  },
}));
