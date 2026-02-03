import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { collections } from './constants';
import {
  UserTasteProfile,
  AffinityScore,
  PersonAffinity,
  EnhancedSwipeItem,
  SwipeFeatures,
  createEmptyTasteProfile,
  GENRE_NAMES,
} from '../../types/recommendations';

// ============================================
// TASTE PROFILE CRUD
// ============================================

/**
 * Get user's taste profile, creating one if it doesn't exist
 */
export async function getTasteProfile(userId: string): Promise<UserTasteProfile> {
  const profileRef = doc(db, collections.users, userId, 'tasteProfile', 'current');

  try {
    const snapshot = await getDoc(profileRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserTasteProfile;
    }

    // Create empty profile if doesn't exist
    const emptyProfile = createEmptyTasteProfile(userId);
    await setDoc(profileRef, {
      ...emptyProfile,
      updatedAt: serverTimestamp(),
    });

    return emptyProfile;
  } catch (error) {
    console.warn('Failed to get taste profile:', error);
    return createEmptyTasteProfile(userId);
  }
}

/**
 * Update taste profile based on a swipe
 */
export async function updateTasteProfileFromSwipe(
  userId: string,
  swipe: {
    direction: 'left' | 'right';
    features: SwipeFeatures;
    contentSnapshot: {
      voteAverage: number;
      releaseYear: number;
      popularity: number;
    };
    engagement: {
      viewDurationMs: number;
    };
    contentId: number;
  }
): Promise<void> {
  const profileRef = doc(db, collections.users, userId, 'tasteProfile', 'current');
  const isLike = swipe.direction === 'right';

  try {
    const snapshot = await getDoc(profileRef);
    let profile: UserTasteProfile;

    if (snapshot.exists()) {
      const data = snapshot.data();
      profile = {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserTasteProfile;
    } else {
      profile = createEmptyTasteProfile(userId);
    }

    // Update genre affinities
    for (const genreId of swipe.features.genreIds) {
      const current = profile.genreAffinities[genreId] || {
        score: 0.5,
        likeCount: 0,
        dislikeCount: 0,
        lastInteraction: new Date(),
      };

      if (isLike) {
        current.likeCount++;
      } else {
        current.dislikeCount++;
      }

      current.score = computeAffinity(current.likeCount, current.dislikeCount);
      current.lastInteraction = new Date();
      profile.genreAffinities[genreId] = current;
    }

    // Update behavior stats
    profile.behavior.totalSwipes++;
    if (isLike) {
      profile.behavior.totalLikes++;

      // Update avg for liked content
      const likeCount = profile.behavior.totalLikes;
      profile.preferences.avgRatingLiked = updateRunningAverage(
        profile.preferences.avgRatingLiked,
        swipe.contentSnapshot.voteAverage,
        likeCount
      );
      profile.preferences.avgYearLiked = updateRunningAverage(
        profile.preferences.avgYearLiked,
        swipe.contentSnapshot.releaseYear,
        likeCount
      );
      profile.preferences.avgPopularityLiked = updateRunningAverage(
        profile.preferences.avgPopularityLiked,
        swipe.contentSnapshot.popularity,
        likeCount
      );
      profile.behavior.avgViewDurationLiked = updateRunningAverage(
        profile.behavior.avgViewDurationLiked,
        swipe.engagement.viewDurationMs,
        likeCount
      );

      // Track recent liked IDs
      profile.recentLikedIds = [
        swipe.contentId,
        ...profile.recentLikedIds.slice(0, 19),
      ];

      // Update preferred decades
      const decade = Math.floor(swipe.contentSnapshot.releaseYear / 10) * 10;
      if (!profile.preferences.preferredDecades.includes(decade)) {
        profile.preferences.preferredDecades = updatePreferredDecades(
          profile.preferences.preferredDecades,
          decade,
          profile.genreAffinities
        );
      }
    } else {
      const dislikeCount = profile.behavior.totalSwipes - profile.behavior.totalLikes;
      profile.behavior.avgViewDurationDisliked = updateRunningAverage(
        profile.behavior.avgViewDurationDisliked,
        swipe.engagement.viewDurationMs,
        dislikeCount
      );

      // Track recent disliked IDs (to avoid showing again)
      profile.recentDislikedIds = profile.recentDislikedIds || [];
      profile.recentDislikedIds = [
        swipe.contentId,
        ...profile.recentDislikedIds.slice(0, 49),
      ];
    }

    // Update peak swipe hours
    const currentHour = new Date().getHours();
    if (!profile.behavior.peakSwipeHours.includes(currentHour)) {
      profile.behavior.peakSwipeHours = [
        currentHour,
        ...profile.behavior.peakSwipeHours.slice(0, 4),
      ];
    }

    profile.updatedAt = new Date();

    // Save updated profile
    await setDoc(profileRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Failed to update taste profile:', error);
  }
}

// ============================================
// AFFINITY COMPUTATION
// ============================================

/**
 * Compute affinity score using Wilson score interval
 * This gives a confidence-weighted score that handles small sample sizes
 */
export function computeAffinity(likes: number, dislikes: number): number {
  const n = likes + dislikes;
  if (n === 0) return 0.5; // Neutral

  const p = likes / n;
  const z = 1.96; // 95% confidence

  // Wilson score lower bound
  const denominator = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const interval = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  return (center - interval) / denominator;
}

/**
 * Update running average efficiently
 */
function updateRunningAverage(
  currentAvg: number,
  newValue: number,
  count: number
): number {
  if (count <= 1) return newValue;
  return currentAvg + (newValue - currentAvg) / count;
}

/**
 * Update preferred decades based on recent likes
 */
function updatePreferredDecades(
  currentDecades: number[],
  newDecade: number,
  genreAffinities: Record<number, AffinityScore>
): number[] {
  // Keep top 3 decades with most likes
  const decadeCounts: Record<number, number> = {};
  for (const decade of currentDecades) {
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
  }
  decadeCounts[newDecade] = (decadeCounts[newDecade] || 0) + 1;

  return Object.entries(decadeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([decade]) => parseInt(decade));
}

// ============================================
// TASTE PROFILE ANALYSIS
// ============================================

/**
 * Get user's top genres by affinity score
 */
export function getTopGenres(
  profile: UserTasteProfile,
  limit: number = 5
): { id: number; name: string; score: number }[] {
  return Object.entries(profile.genreAffinities)
    .filter(([_, affinity]) => affinity.likeCount >= 2) // Minimum interactions
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, affinity]) => ({
      id: parseInt(id),
      name: GENRE_NAMES[parseInt(id)] || 'Unknown',
      score: affinity.score,
    }));
}

/**
 * Get user's top actors by affinity
 */
export function getTopActors(
  profile: UserTasteProfile,
  limit: number = 5
): { id: number; name: string; score: number }[] {
  return Object.entries(profile.actorAffinities)
    .filter(([_, affinity]) => affinity.interactionCount >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, affinity]) => ({
      id: parseInt(id),
      name: affinity.name,
      score: affinity.score,
    }));
}

/**
 * Get user's top directors by affinity
 */
export function getTopDirectors(
  profile: UserTasteProfile,
  limit: number = 5
): { id: number; name: string; score: number }[] {
  return Object.entries(profile.directorAffinities)
    .filter(([_, affinity]) => affinity.interactionCount >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, affinity]) => ({
      id: parseInt(id),
      name: affinity.name,
      score: affinity.score,
    }));
}

/**
 * Check if user has enough data for personalized recommendations
 */
export function hasEnoughDataForRecommendations(profile: UserTasteProfile): boolean {
  return profile.behavior.totalLikes >= 3; // Match MIN_SELECTIONS in onboarding
}

/**
 * Get all content IDs the user has interacted with (liked or disliked)
 * Used to filter out content that shouldn't be shown again
 */
export function getInteractedContentIds(profile: UserTasteProfile): Set<number> {
  const likedIds = profile.recentLikedIds || [];
  const dislikedIds = profile.recentDislikedIds || [];
  return new Set([...likedIds, ...dislikedIds]);
}

/**
 * Check if user has already interacted with a content item
 */
export function hasInteractedWith(profile: UserTasteProfile, contentId: number): boolean {
  const likedIds = profile.recentLikedIds || [];
  const dislikedIds = profile.recentDislikedIds || [];
  return likedIds.includes(contentId) || dislikedIds.includes(contentId);
}

/**
 * Get recommendation confidence level based on data quantity
 */
export function getRecommendationConfidence(
  profile: UserTasteProfile
): 'low' | 'medium' | 'high' {
  const likes = profile.behavior.totalLikes;
  if (likes < 10) return 'low';
  if (likes < 30) return 'medium';
  return 'high';
}

// ============================================
// ONBOARDING SEED
// ============================================

/**
 * Seed taste profile from onboarding movie selections
 * This gives new users immediate personalized recommendations
 */
export async function seedTasteProfileFromOnboarding(
  userId: string,
  selectedMovies: Array<{
    id: number;
    type: 'movie' | 'tv';
    title: string;
    genreIds: number[];
    rating: number;
    releaseYear: number;
    popularity?: number;
  }>
): Promise<void> {
  const profileRef = doc(db, collections.users, userId, 'tasteProfile', 'current');

  try {
    // Create or get existing profile
    const snapshot = await getDoc(profileRef);
    let profile: UserTasteProfile;

    if (snapshot.exists()) {
      const data = snapshot.data();
      profile = {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserTasteProfile;
    } else {
      profile = createEmptyTasteProfile(userId);
    }

    // Process each selected movie as a "like"
    for (const movie of selectedMovies) {
      // Update genre affinities
      for (const genreId of movie.genreIds) {
        const current = profile.genreAffinities[genreId] || {
          score: 0.5,
          likeCount: 0,
          dislikeCount: 0,
          lastInteraction: new Date(),
        };

        current.likeCount++;
        current.score = computeAffinity(current.likeCount, current.dislikeCount);
        current.lastInteraction = new Date();
        profile.genreAffinities[genreId] = current;
      }

      // Update behavior stats
      profile.behavior.totalSwipes++;
      profile.behavior.totalLikes++;

      // Update preferences
      const likeCount = profile.behavior.totalLikes;
      profile.preferences.avgRatingLiked = updateRunningAverage(
        profile.preferences.avgRatingLiked,
        movie.rating,
        likeCount
      );
      profile.preferences.avgYearLiked = updateRunningAverage(
        profile.preferences.avgYearLiked,
        movie.releaseYear,
        likeCount
      );
      if (movie.popularity) {
        profile.preferences.avgPopularityLiked = updateRunningAverage(
          profile.preferences.avgPopularityLiked,
          movie.popularity,
          likeCount
        );
      }

      // Track recent liked IDs
      profile.recentLikedIds = [
        movie.id,
        ...profile.recentLikedIds.slice(0, 19),
      ];

      // Update preferred decades
      const decade = Math.floor(movie.releaseYear / 10) * 10;
      if (!profile.preferences.preferredDecades.includes(decade)) {
        profile.preferences.preferredDecades = [
          decade,
          ...profile.preferences.preferredDecades.slice(0, 2),
        ];
      }
    }

    profile.updatedAt = new Date();

    // Save updated profile
    await setDoc(profileRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    });

    console.log(`Seeded taste profile with ${selectedMovies.length} movies`);
  } catch (error) {
    console.warn('Failed to seed taste profile:', error);
    throw error;
  }
}
