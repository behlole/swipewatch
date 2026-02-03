import { UserTasteProfile, Recommendation, getTimeOfDay } from '../../types/recommendations';
import { getTasteProfile, hasEnoughDataForRecommendations, getRecommendationConfidence } from '../firebase/tasteProfile';
import { getSwipedContentIds } from '../firebase/firestore';
import {
  getSimilarToLiked,
  getGenreBasedRecommendations,
  getMoreLikeThis,
  getActorBasedRecommendations,
  getDirectorBasedRecommendations,
  getMoodBasedRecommendations,
  getHiddenGemRecommendations,
  getExplorationRecommendations as getExplorationRecs,
} from './contentBased';
import {
  getPopularAmongSimilarFans,
  getTrendingContent,
  getMostLikedContent,
} from './collaborative';

// ============================================
// UNIFIED RECOMMENDATION API
// ============================================

export interface RecommendationResult {
  recommendations: Recommendation[];
  confidence: 'low' | 'medium' | 'high';
  sources: {
    likedSimilar: number;
    genreBased: number;
    collaborative: number;
    trending: number;
    actorBased: number;
    directorBased: number;
    moodBased: number;
    hiddenGems: number;
    exploration: number;
  };
}

/**
 * Get personalized recommendations for a user
 * Enhanced with multiple recommendation sources and smart mixing
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20
): Promise<RecommendationResult> {
  // Get user's taste profile and swiped content
  const [profile, swipedIds] = await Promise.all([
    getTasteProfile(userId),
    getSwipedContentIds(userId),
  ]);

  const allRecommendations: Recommendation[] = [];
  const sources = {
    likedSimilar: 0,
    genreBased: 0,
    collaborative: 0,
    trending: 0,
    actorBased: 0,
    directorBased: 0,
    moodBased: 0,
    hiddenGems: 0,
    exploration: 0,
  };

  // Check if user has enough data for personalized recommendations
  const hasEnoughData = hasEnoughDataForRecommendations(profile);
  const confidence = getRecommendationConfidence(profile);

  if (hasEnoughData) {
    // Calculate dynamic weights based on user's engagement level
    const totalLikes = profile.behavior.totalLikes;
    const hasActorPrefs = Object.keys(profile.actorAffinities).length > 0;
    const hasDirectorPrefs = Object.keys(profile.directorAffinities).length > 0;

    // Primary sources (always fetch)
    const primaryPromises = [
      getSimilarToLiked(profile, swipedIds, Math.ceil(limit * 0.25)),
      getGenreBasedRecommendations(profile, swipedIds, Math.ceil(limit * 0.2)),
      getPopularAmongSimilarFans(profile, swipedIds, Math.ceil(limit * 0.15)),
      getMoodBasedRecommendations(profile, swipedIds, Math.ceil(limit * 0.1)),
    ];

    // Secondary sources (based on user data availability)
    const secondaryPromises: Promise<Recommendation[]>[] = [];

    if (hasActorPrefs) {
      secondaryPromises.push(getActorBasedRecommendations(profile, swipedIds, Math.ceil(limit * 0.1)));
    }
    if (hasDirectorPrefs) {
      secondaryPromises.push(getDirectorBasedRecommendations(profile, swipedIds, Math.ceil(limit * 0.1)));
    }

    // Discovery sources (increase with confidence)
    if (confidence === 'high') {
      secondaryPromises.push(getHiddenGemRecommendations(profile, swipedIds, Math.ceil(limit * 0.1)));
      secondaryPromises.push(getExplorationRecs(profile, swipedIds, Math.ceil(limit * 0.1)));
    } else if (confidence === 'medium') {
      secondaryPromises.push(getHiddenGemRecommendations(profile, swipedIds, Math.ceil(limit * 0.05)));
    }

    // Fetch all recommendations in parallel
    const [primaryResults, secondaryResults] = await Promise.all([
      Promise.all(primaryPromises),
      Promise.all(secondaryPromises),
    ]);

    const [similarToLiked, genreBased, collaborative, moodBased] = primaryResults;

    allRecommendations.push(...similarToLiked);
    allRecommendations.push(...genreBased);
    allRecommendations.push(...collaborative);
    allRecommendations.push(...moodBased);

    sources.likedSimilar = similarToLiked.length;
    sources.genreBased = genreBased.length;
    sources.collaborative = collaborative.length;
    sources.moodBased = moodBased.length;

    // Add secondary results
    let secondaryIndex = 0;
    if (hasActorPrefs && secondaryResults[secondaryIndex]) {
      const actorRecs = secondaryResults[secondaryIndex++];
      allRecommendations.push(...actorRecs);
      sources.actorBased = actorRecs.length;
    }
    if (hasDirectorPrefs && secondaryResults[secondaryIndex]) {
      const directorRecs = secondaryResults[secondaryIndex++];
      allRecommendations.push(...directorRecs);
      sources.directorBased = directorRecs.length;
    }
    if (confidence === 'high') {
      if (secondaryResults[secondaryIndex]) {
        const hiddenGems = secondaryResults[secondaryIndex++];
        allRecommendations.push(...hiddenGems);
        sources.hiddenGems = hiddenGems.length;
      }
      if (secondaryResults[secondaryIndex]) {
        const exploration = secondaryResults[secondaryIndex++];
        allRecommendations.push(...exploration);
        sources.exploration = exploration.length;
      }
    } else if (confidence === 'medium' && secondaryResults[secondaryIndex]) {
      const hiddenGems = secondaryResults[secondaryIndex++];
      allRecommendations.push(...hiddenGems);
      sources.hiddenGems = hiddenGems.length;
    }
  } else {
    // Fallback to trending/popular content for new users
    const [trending, popular] = await Promise.all([
      getTrendingContent(swipedIds, Math.ceil(limit * 0.5)),
      getMostLikedContent(swipedIds, Math.ceil(limit * 0.5)),
    ]);

    allRecommendations.push(...trending);
    allRecommendations.push(...popular);

    sources.trending = trending.length + popular.length;
  }

  // Dedupe and sort by score
  const deduped = dedupeRecommendations(allRecommendations);

  // Apply smart ranking with diversity bonus
  const ranked = smartRank(deduped, profile);

  // Add diversity - don't show too many from same source
  const diversified = diversifyRecommendations(ranked, limit);

  return {
    recommendations: diversified.slice(0, limit),
    confidence,
    sources,
  };
}

/**
 * Smart ranking that balances relevance with diversity and freshness
 */
function smartRank(recommendations: Recommendation[], profile: UserTasteProfile): Recommendation[] {
  const timeOfDay = getTimeOfDay();

  return recommendations
    .map(rec => {
      let adjustedScore = rec.score;

      // Time-of-day relevance boost
      if (rec.source === 'mood_based') {
        adjustedScore *= 1.1;
      }

      // Exploration bonus for users with established taste
      if (rec.source === 'exploration' || rec.source === 'hidden_gem') {
        if (profile.behavior.totalLikes > 20) {
          adjustedScore *= 1.05;
        }
      }

      // Actor/director match premium
      if (rec.source === 'actor_match' || rec.source === 'director_match') {
        adjustedScore *= 1.15;
      }

      // Quality floor - ensure highly rated content gets consideration
      if (rec.voteAverage >= 8.0) {
        adjustedScore = Math.max(adjustedScore, 0.7);
      }

      return { ...rec, score: Math.min(1, adjustedScore) };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Get "More Like This" recommendations for a specific piece of content
 */
export async function getContentRecommendations(
  userId: string,
  contentId: number,
  contentType: 'movie' | 'tv',
  limit: number = 10
): Promise<Recommendation[]> {
  const [profile, swipedIds] = await Promise.all([
    getTasteProfile(userId),
    getSwipedContentIds(userId),
  ]);

  return getMoreLikeThis(contentId, contentType, profile, swipedIds, limit);
}

/**
 * Get recommendations for the swipe deck
 * Mix personalized content with some discovery
 */
export async function getSwipeDeckRecommendations(
  userId: string,
  limit: number = 50
): Promise<Recommendation[]> {
  const [profile, swipedIds] = await Promise.all([
    getTasteProfile(userId),
    getSwipedContentIds(userId),
  ]);

  const hasEnoughData = hasEnoughDataForRecommendations(profile);

  if (!hasEnoughData) {
    // New user - return trending content
    return getTrendingContent(swipedIds, limit);
  }

  // Mix: 70% personalized, 30% discovery/trending
  const personalizedLimit = Math.ceil(limit * 0.7);
  const discoveryLimit = limit - personalizedLimit;

  const [personalized, discovery] = await Promise.all([
    Promise.all([
      getSimilarToLiked(profile, swipedIds, Math.ceil(personalizedLimit * 0.5)),
      getGenreBasedRecommendations(profile, swipedIds, Math.ceil(personalizedLimit * 0.5)),
    ]).then(([a, b]) => [...a, ...b]),
    getTrendingContent(swipedIds, discoveryLimit),
  ]);

  const combined = [...personalized, ...discovery];
  const deduped = dedupeRecommendations(combined);

  // Shuffle to mix personalized and discovery
  return shuffleArray(deduped).slice(0, limit);
}

/**
 * Get exploration recommendations (content outside user's usual preferences)
 */
export async function getExplorationRecommendations(
  userId: string,
  limit: number = 10
): Promise<Recommendation[]> {
  const swipedIds = await getSwipedContentIds(userId);

  // Get trending content - good for discovery
  const trending = await getTrendingContent(swipedIds, limit * 2);

  // Shuffle and return
  return shuffleArray(trending).slice(0, limit);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Remove duplicate recommendations by contentId
 */
function dedupeRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set<number>();
  return recommendations.filter((rec) => {
    if (seen.has(rec.contentId)) {
      return false;
    }
    seen.add(rec.contentId);
    return true;
  });
}

/**
 * Diversify recommendations to avoid too many from same source
 */
function diversifyRecommendations(
  recommendations: Recommendation[],
  limit: number
): Recommendation[] {
  const result: Recommendation[] = [];
  const sourceCount: Record<string, number> = {};
  const maxPerSource = Math.ceil(limit * 0.5); // Max 50% from any single source

  for (const rec of recommendations) {
    const currentCount = sourceCount[rec.source] || 0;
    if (currentCount < maxPerSource) {
      result.push(rec);
      sourceCount[rec.source] = currentCount + 1;
    }

    if (result.length >= limit) break;
  }

  // If we don't have enough, add remaining
  if (result.length < limit) {
    for (const rec of recommendations) {
      if (!result.includes(rec)) {
        result.push(rec);
        if (result.length >= limit) break;
      }
    }
  }

  return result;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Re-export types and functions for convenience
export {
  Recommendation,
  RecommendationExplanation,
  UserTasteProfile,
} from '../../types/recommendations';

export { getTasteProfile, getTopGenres, getTopActors, getTopDirectors } from '../firebase/tasteProfile';
