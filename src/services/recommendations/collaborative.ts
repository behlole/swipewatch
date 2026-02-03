import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { collections } from '../firebase/firestore';
import {
  UserTasteProfile,
  Recommendation,
  RecommendationExplanation,
  ContentPopularity,
  GENRE_NAMES,
} from '../../types/recommendations';
import { getTopGenres } from '../firebase/tasteProfile';

// ============================================
// COLLABORATIVE FILTERING (Client-Side)
// ============================================

/**
 * Get popular content among fans of user's top genres
 * This is a lightweight collaborative filtering approach that works client-side
 */
export async function getPopularAmongSimilarFans(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limitCount: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const topGenres = getTopGenres(profile, 3);

  for (const genre of topGenres) {
    if (recommendations.length >= limitCount) break;

    try {
      const popularityRef = collection(db, collections.contentPopularity);

      // Query for content popular with fans of this genre
      const q = query(
        popularityRef,
        where(`likesByGenreFans.${genre.id}`, '>=', 2), // At least 2 fans liked
        orderBy(`likesByGenreFans.${genre.id}`, 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const popularity = doc.data() as ContentPopularity;

        if (
          excludeIds.has(popularity.contentId) ||
          recommendations.some(r => r.contentId === popularity.contentId)
        ) {
          continue;
        }

        const fanCount = popularity.likesByGenreFans[genre.id] || 0;

        const explanation: RecommendationExplanation = {
          text: `Popular with ${genre.name} fans like you`,
          type: 'genre_fans',
          fanGenreId: genre.id,
          fanGenreName: genre.name,
        };

        recommendations.push({
          contentId: popularity.contentId,
          contentType: popularity.contentType,
          score: calculateCollaborativeScore(popularity, genre.score, fanCount),
          source: 'genre_fans',
          explanation,
          title: popularity.snapshot.title,
          posterPath: popularity.snapshot.posterPath,
          releaseYear: popularity.snapshot.releaseYear,
          voteAverage: popularity.snapshot.voteAverage,
          genreIds: [], // Not stored in popularity, will need to fetch if needed
        });

        if (recommendations.length >= limitCount) break;
      }
    } catch (error) {
      // Index might not exist yet, or no data - this is expected initially
      console.warn(`Failed to get collaborative recs for genre ${genre.name}:`, error);
    }
  }

  return recommendations;
}

/**
 * Get trending content (recently popular)
 */
export async function getTrendingContent(
  excludeIds: Set<number>,
  limitCount: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  try {
    const popularityRef = collection(db, collections.contentPopularity);

    // Query for recently liked content
    const q = query(
      popularityRef,
      where('recentLikes', '>=', 1),
      orderBy('recentLikes', 'desc'),
      limit(limitCount * 2) // Fetch extra to account for exclusions
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const popularity = doc.data() as ContentPopularity;

      if (
        excludeIds.has(popularity.contentId) ||
        recommendations.some(r => r.contentId === popularity.contentId)
      ) {
        continue;
      }

      const explanation: RecommendationExplanation = {
        text: 'Trending this week',
        type: 'trending',
      };

      recommendations.push({
        contentId: popularity.contentId,
        contentType: popularity.contentType,
        score: popularity.recentLikes / 10, // Normalize
        source: 'trending',
        explanation,
        title: popularity.snapshot.title,
        posterPath: popularity.snapshot.posterPath,
        releaseYear: popularity.snapshot.releaseYear,
        voteAverage: popularity.snapshot.voteAverage,
        genreIds: [],
      });

      if (recommendations.length >= limitCount) break;
    }
  } catch (error) {
    console.warn('Failed to get trending content:', error);
  }

  return recommendations;
}

/**
 * Calculate collaborative filtering score
 */
function calculateCollaborativeScore(
  popularity: ContentPopularity,
  genreAffinity: number,
  fanCount: number
): number {
  // Combine:
  // 1. User's genre affinity (how much they like this genre)
  // 2. Total likes (overall popularity)
  // 3. Fan count for this genre (specific collaborative signal)
  // 4. Rating (quality signal)

  const affinityWeight = genreAffinity * 0.3;
  const popularityWeight = Math.min(popularity.totalLikes / 50, 1) * 0.2;
  const fanWeight = Math.min(fanCount / 10, 1) * 0.3;
  const ratingWeight = (popularity.snapshot.voteAverage / 10) * 0.2;

  return affinityWeight + popularityWeight + fanWeight + ratingWeight;
}

/**
 * Get most liked content overall (fallback when user has little data)
 */
export async function getMostLikedContent(
  excludeIds: Set<number>,
  limitCount: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  try {
    const popularityRef = collection(db, collections.contentPopularity);

    const q = query(
      popularityRef,
      where('totalLikes', '>=', 1),
      orderBy('totalLikes', 'desc'),
      limit(limitCount * 2)
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const popularity = doc.data() as ContentPopularity;

      if (
        excludeIds.has(popularity.contentId) ||
        recommendations.some(r => r.contentId === popularity.contentId)
      ) {
        continue;
      }

      const explanation: RecommendationExplanation = {
        text: 'Popular with SwipeWatch users',
        type: 'trending',
      };

      recommendations.push({
        contentId: popularity.contentId,
        contentType: popularity.contentType,
        score: popularity.totalLikes / 100,
        source: 'trending',
        explanation,
        title: popularity.snapshot.title,
        posterPath: popularity.snapshot.posterPath,
        releaseYear: popularity.snapshot.releaseYear,
        voteAverage: popularity.snapshot.voteAverage,
        genreIds: [],
      });

      if (recommendations.length >= limitCount) break;
    }
  } catch (error) {
    console.warn('Failed to get most liked content:', error);
  }

  return recommendations;
}
