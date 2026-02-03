import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { collections } from './constants';
import { WatchlistItem, SwipeItem, WatchParty, GroupSwipe, GroupMatch, Media } from '../../types';
import {
  EnhancedSwipeItem,
  SwipeFeatures,
  SwipeEngagement,
  SwipeContext,
  ContentPopularity,
  createSwipeContext,
  createDefaultEngagement,
  getTimeOfDay,
} from '../../types/recommendations';
import { getMovieDetails, getTVDetails } from '../tmdb/endpoints';
import { updateTasteProfileFromSwipe } from './tasteProfile';

// Re-export collections for convenience
export { collections } from './constants';

// ============ Watchlist Operations ============

export async function addToWatchlist(
  userId: string,
  item: Omit<WatchlistItem, 'id' | 'addedAt'>
): Promise<string> {
  const watchlistRef = collection(db, collections.watchlists, userId, 'items');
  const itemRef = doc(watchlistRef, item.contentId.toString());

  const watchlistItem: WatchlistItem = {
    ...item,
    id: item.contentId.toString(),
    addedAt: new Date(),
  };

  await setDoc(itemRef, {
    ...watchlistItem,
    addedAt: serverTimestamp(),
  });

  return watchlistItem.id;
}

export async function removeFromWatchlist(
  userId: string,
  contentId: number
): Promise<void> {
  const itemRef = doc(db, collections.watchlists, userId, 'items', contentId.toString());
  await deleteDoc(itemRef);
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  const watchlistRef = collection(db, collections.watchlists, userId, 'items');
  const q = query(watchlistRef, orderBy('addedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    ...doc.data(),
    addedAt: doc.data().addedAt?.toDate() || new Date(),
    watchedAt: doc.data().watchedAt?.toDate(),
  })) as WatchlistItem[];
}

export function subscribeToWatchlist(
  userId: string,
  callback: (items: WatchlistItem[]) => void
): Unsubscribe {
  const watchlistRef = collection(db, collections.watchlists, userId, 'items');
  const q = query(watchlistRef, orderBy('addedAt', 'desc'));

  return onSnapshot(q, snapshot => {
    const items = snapshot.docs.map(doc => ({
      ...doc.data(),
      addedAt: doc.data().addedAt?.toDate() || new Date(),
      watchedAt: doc.data().watchedAt?.toDate(),
    })) as WatchlistItem[];
    callback(items);
  });
}

export async function markAsWatched(
  userId: string,
  contentId: number,
  rating?: number
): Promise<void> {
  const itemRef = doc(db, collections.watchlists, userId, 'items', contentId.toString());
  await updateDoc(itemRef, {
    watched: true,
    watchedAt: serverTimestamp(),
    ...(rating && { userRating: rating }),
  });
}

export async function isInWatchlist(
  userId: string,
  contentId: number
): Promise<boolean> {
  const itemRef = doc(db, collections.watchlists, userId, 'items', contentId.toString());
  const snapshot = await getDoc(itemRef);
  return snapshot.exists();
}

// ============ Swipe Operations ============

/**
 * Record a basic swipe (legacy support)
 */
export async function recordSwipe(
  userId: string,
  swipe: Omit<SwipeItem, 'id' | 'createdAt'>
): Promise<string> {
  const swipesRef = collection(db, collections.swipes);
  const swipeRef = doc(swipesRef);

  await setDoc(swipeRef, {
    ...swipe,
    userId,
    createdAt: serverTimestamp(),
  });

  // Update user stats
  const userRef = doc(db, collections.users, userId);
  await updateDoc(userRef, {
    'stats.totalSwipes': increment(1),
    ...(swipe.direction === 'right' && { 'stats.totalLikes': increment(1) }),
  }).catch(() => {
    // User doc might not exist yet, ignore
  });

  return swipeRef.id;
}

/**
 * Extract ML features from TMDB movie/TV details
 */
async function extractFeatures(
  contentId: number,
  contentType: 'movie' | 'tv',
  genreIds: number[]
): Promise<SwipeFeatures> {
  try {
    if (contentType === 'movie') {
      const details = await getMovieDetails(contentId);
      return {
        genreIds: details.genres?.map(g => g.id) || genreIds,
        primaryGenre: genreIds[0] || 0,
        topCastIds: details.credits?.cast?.slice(0, 5).map(c => c.id) || [],
        directorId: details.credits?.crew?.find(c => c.job === 'Director')?.id,
        runtime: details.runtime,
        originalLanguage: details.original_language || 'en',
        keywords: (details as any).keywords?.keywords?.slice(0, 10).map((k: any) => k.id) || [],
        productionCompanyIds: details.production_companies?.slice(0, 3).map(p => p.id) || [],
      };
    } else {
      const details = await getTVDetails(contentId);
      return {
        genreIds: details.genres?.map(g => g.id) || genreIds,
        primaryGenre: genreIds[0] || 0,
        topCastIds: details.credits?.cast?.slice(0, 5).map(c => c.id) || [],
        directorId: details.created_by?.[0]?.id,
        runtime: details.episode_run_time?.[0],
        originalLanguage: details.original_language || 'en',
        keywords: (details as any).keywords?.results?.slice(0, 10).map((k: any) => k.id) || [],
        productionCompanyIds: details.production_companies?.slice(0, 3).map(p => p.id) || [],
      };
    }
  } catch (error) {
    console.warn('Failed to fetch content details for ML features:', error);
    // Return basic features if API call fails
    return {
      genreIds,
      primaryGenre: genreIds[0] || 0,
      topCastIds: [],
      originalLanguage: 'en',
      keywords: [],
    };
  }
}

/**
 * Record an enhanced swipe with rich ML data
 */
export async function recordEnhancedSwipe(
  userId: string,
  media: Media,
  direction: 'left' | 'right',
  engagement: SwipeEngagement = createDefaultEngagement(),
  sessionPosition: number = 1,
  sessionContext: 'solo' | 'group' = 'solo',
  groupId?: string
): Promise<string> {
  const swipesRef = collection(db, collections.swipes);
  const swipeRef = doc(swipesRef);

  // Extract ML features (async, but don't block on it)
  const featuresPromise = extractFeatures(media.id, media.type, media.genreIds);

  // Create context
  const context: SwipeContext = createSwipeContext(sessionPosition);

  // Get features (with timeout to not slow down UX)
  let features: SwipeFeatures;
  try {
    features = await Promise.race([
      featuresPromise,
      new Promise<SwipeFeatures>((resolve) =>
        setTimeout(() => resolve({
          genreIds: media.genreIds,
          primaryGenre: media.genreIds[0] || 0,
          topCastIds: [],
          originalLanguage: 'en',
          keywords: [],
        }), 3000)
      ),
    ]);
  } catch {
    features = {
      genreIds: media.genreIds,
      primaryGenre: media.genreIds[0] || 0,
      topCastIds: [],
      originalLanguage: 'en',
      keywords: [],
    };
  }

  // Create enhanced swipe item
  const enhancedSwipe: Omit<EnhancedSwipeItem, 'id' | 'createdAt'> = {
    userId,
    contentType: media.type,
    contentId: media.id,
    direction,
    sessionContext,
    groupId,
    contentSnapshot: {
      title: media.title,
      posterPath: media.posterPath || '',
      releaseYear: media.releaseYear,
      voteAverage: media.rating,
      popularity: media.popularity || 0,
    },
    features,
    engagement,
    context,
  };

  // Save swipe
  await setDoc(swipeRef, {
    ...enhancedSwipe,
    createdAt: serverTimestamp(),
  });

  // Update user stats
  const userRef = doc(db, collections.users, userId);
  updateDoc(userRef, {
    'stats.totalSwipes': increment(1),
    ...(direction === 'right' && { 'stats.totalLikes': increment(1) }),
  }).catch(() => {
    // User doc might not exist yet
  });

  // Update content popularity (for collaborative filtering)
  if (direction === 'right') {
    updateContentPopularity(media, features.genreIds).catch(() => {
      // Non-critical, don't fail the swipe
    });
  }

  // Update user taste profile (async, non-blocking)
  updateTasteProfileFromSwipe(userId, {
    direction,
    features,
    contentSnapshot: enhancedSwipe.contentSnapshot,
    engagement,
    contentId: media.id,
  }).catch(() => {
    // Non-critical, don't fail the swipe
  });

  return swipeRef.id;
}

/**
 * Update content popularity for collaborative filtering
 */
async function updateContentPopularity(
  media: Media,
  genreIds: number[]
): Promise<void> {
  const popularityRef = doc(db, collections.contentPopularity, `${media.type}_${media.id}`);

  try {
    const snapshot = await getDoc(popularityRef);

    if (snapshot.exists()) {
      // Update existing record
      const updates: Record<string, any> = {
        totalLikes: increment(1),
        recentLikes: increment(1),
        lastUpdated: serverTimestamp(),
      };

      // Increment likes for each genre
      for (const genreId of genreIds) {
        updates[`likesByGenreFans.${genreId}`] = increment(1);
      }

      await updateDoc(popularityRef, updates);
    } else {
      // Create new record
      const likesByGenreFans: Record<number, number> = {};
      for (const genreId of genreIds) {
        likesByGenreFans[genreId] = 1;
      }

      const popularity: Omit<ContentPopularity, 'lastUpdated'> = {
        contentId: media.id,
        contentType: media.type,
        totalLikes: 1,
        totalDislikes: 0,
        likesByGenreFans,
        recentLikes: 1,
        recentDislikes: 0,
        snapshot: {
          title: media.title,
          posterPath: media.posterPath || '',
          releaseYear: media.releaseYear,
          voteAverage: media.rating,
          popularity: media.popularity || 0,
        },
      };

      await setDoc(popularityRef, {
        ...popularity,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn('Failed to update content popularity:', error);
  }
}

/**
 * Get popular content among fans of specific genres
 */
export async function getPopularForGenreFans(
  genreId: number,
  limitCount: number = 20
): Promise<ContentPopularity[]> {
  const popularityRef = collection(db, collections.contentPopularity);

  // Query for content popular with fans of this genre
  const q = query(
    popularityRef,
    where(`likesByGenreFans.${genreId}`, '>=', 1),
    orderBy(`likesByGenreFans.${genreId}`, 'desc'),
    limit(limitCount)
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ContentPopularity);
  } catch (error) {
    console.warn('Failed to get popular content for genre fans:', error);
    return [];
  }
}

export async function hasSwipedContent(
  userId: string,
  contentId: number
): Promise<boolean> {
  const swipesRef = collection(db, collections.swipes);
  const q = query(
    swipesRef,
    where('userId', '==', userId),
    where('contentId', '==', contentId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function getSwipedContentIds(userId: string): Promise<Set<number>> {
  const swipesRef = collection(db, collections.swipes);
  const q = query(swipesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const ids = new Set<number>();
  snapshot.docs.forEach(doc => {
    ids.add(doc.data().contentId);
  });

  return ids;
}

// ============ Watch Party Operations ============

export async function createWatchParty(
  hostId: string,
  settings: WatchParty['settings'],
  moviePool: string[]
): Promise<string> {
  const code = generateSessionCode();
  const partyRef = doc(collection(db, collections.watchParties));

  const party: Omit<WatchParty, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'> = {
    code,
    hostId,
    status: 'lobby',
    settings,
    moviePool,
    participants: {},
    totalSwipes: 0,
  };

  await setDoc(partyRef, {
    ...party,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  });

  return partyRef.id;
}

export async function getWatchPartyByCode(code: string): Promise<WatchParty | null> {
  const partiesRef = collection(db, collections.watchParties);
  const q = query(
    partiesRef,
    where('code', '==', code.toUpperCase()),
    where('status', 'in', ['lobby', 'swiping']),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as WatchParty;
}

export function subscribeToWatchParty(
  sessionId: string,
  callback: (party: WatchParty | null) => void
): Unsubscribe {
  const partyRef = doc(db, collections.watchParties, sessionId);

  return onSnapshot(partyRef, snapshot => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as WatchParty);
  });
}

export async function joinWatchParty(
  sessionId: string,
  userId: string,
  displayName: string,
  photoURL: string | null
): Promise<void> {
  const partyRef = doc(db, collections.watchParties, sessionId);

  await updateDoc(partyRef, {
    [`participants.${userId}`]: {
      displayName,
      photoURL,
      joinedAt: serverTimestamp(),
      status: 'active',
      swipeProgress: 0,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function leaveWatchParty(
  sessionId: string,
  userId: string
): Promise<void> {
  const partyRef = doc(db, collections.watchParties, sessionId);

  await updateDoc(partyRef, {
    [`participants.${userId}.status`]: 'left',
    updatedAt: serverTimestamp(),
  });
}

export async function startSwipingSession(sessionId: string): Promise<void> {
  const partyRef = doc(db, collections.watchParties, sessionId);

  await updateDoc(partyRef, {
    status: 'swiping',
    updatedAt: serverTimestamp(),
  });
}

// Helper function
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
