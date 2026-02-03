import { Timestamp } from 'firebase/firestore';

// ============================================
// ENHANCED SWIPE DATA
// ============================================

/**
 * Rich ML features extracted from content
 */
export interface SwipeFeatures {
  genreIds: number[];
  primaryGenre?: number;
  topCastIds?: number[];      // Top 5 actor TMDB IDs
  directorId?: number;
  runtime?: number;          // Minutes
  originalLanguage?: string;
  keywords?: number[];        // TMDB keyword IDs (top 10)
  productionCompanyIds?: number[];
}

/**
 * Engagement metrics captured during swipe
 */
export interface SwipeEngagement {
  viewDurationMs: number;    // Time spent viewing card before swipe
  swipeVelocity: number;     // Pixels per second (quick vs deliberate)
  swipeDistance: number;     // Total distance traveled
  cardExpanded: boolean;     // Did user tap for details?
  detailViewDurationMs?: number;  // Time on detail screen if expanded
  trailerWatched: boolean;
}

/**
 * Contextual information about the swipe
 */
export interface SwipeContext {
  sessionPosition: number;   // Position in current swipe session (1st, 2nd, etc.)
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;         // 0-6 (Sunday-Saturday)
  deviceType?: 'phone' | 'tablet';
}

/**
 * Content snapshot stored with swipe for ML analysis
 */
export interface SwipeContentSnapshot {
  title: string;
  posterPath: string;
  releaseYear: number;
  voteAverage: number;
  popularity: number;
}

/**
 * Enhanced swipe item with all ML-relevant data
 */
export interface EnhancedSwipeItem {
  // Core identifiers
  id: string;
  userId: string;
  contentType: 'movie' | 'tv';
  contentId: number;
  direction: 'left' | 'right' | 'up';
  createdAt: Date | Timestamp;
  sessionContext: 'solo' | 'group';
  groupId?: string;

  // Content snapshot for display
  contentSnapshot: SwipeContentSnapshot;

  // Rich ML features
  features: SwipeFeatures;

  // Engagement metrics
  engagement: SwipeEngagement;

  // Context
  context: SwipeContext;
}

// ============================================
// USER TASTE PROFILE
// ============================================

/**
 * Affinity score for a genre/actor/director
 */
export interface AffinityScore {
  score: number;           // 0-1 normalized affinity
  likeCount: number;       // Times liked content with this attribute
  dislikeCount: number;    // Times disliked content with this attribute
  lastInteraction: Date | Timestamp;
}

/**
 * Person (actor/director) affinity with name for display
 */
export interface PersonAffinity {
  score: number;
  name: string;            // Denormalized for display
  interactionCount: number;
  lastInteraction: Date | Timestamp;
}

/**
 * User's content preferences derived from swipe patterns
 */
export interface UserContentPreferences {
  avgRatingLiked: number;
  avgYearLiked: number;
  avgRuntimeLiked: number;
  avgPopularityLiked: number;
  preferredDecades: number[];        // e.g., [2010, 2020]
  preferredLanguages: string[];
}

/**
 * User's behavioral patterns
 */
export interface UserBehaviorPatterns {
  avgViewDurationLiked: number;      // Avg time viewing liked content
  avgViewDurationDisliked: number;   // Avg time viewing disliked content
  peakSwipeHours: number[];          // Hours when user is most active
  swipeVelocityPattern: 'quick' | 'deliberate' | 'mixed';
  totalSwipes: number;
  totalLikes: number;
}

/**
 * Complete user taste profile for recommendations
 */
export interface UserTasteProfile {
  userId: string;
  updatedAt: Date | Timestamp;

  // Attribute affinities
  genreAffinities: Record<number, AffinityScore>;
  actorAffinities: Record<number, PersonAffinity>;
  directorAffinities: Record<number, PersonAffinity>;
  keywordAffinities: Record<number, number>;  // keyword ID -> score

  // Content preferences
  preferences: UserContentPreferences;

  // Behavioral patterns
  behavior: UserBehaviorPatterns;

  // Recently liked content IDs (for "Because you liked X")
  recentLikedIds: number[];  // Last 20 liked content IDs

  // Recently disliked/skipped content IDs (to avoid showing again)
  recentDislikedIds: number[];  // Last 50 disliked content IDs
}

// ============================================
// CONTENT POPULARITY (for Collaborative Filtering)
// ============================================

/**
 * Aggregated popularity data for a piece of content
 */
export interface ContentPopularity {
  contentId: number;
  contentType: 'movie' | 'tv';
  totalLikes: number;
  totalDislikes: number;

  // Likes from fans of each genre (for "Popular with Sci-Fi fans")
  likesByGenreFans: Record<number, number>;  // genreId -> like count

  // Recent activity
  recentLikes: number;       // Last 7 days
  recentDislikes: number;    // Last 7 days

  // Content snapshot for display
  snapshot: SwipeContentSnapshot;

  lastUpdated: Date | Timestamp;
}

// ============================================
// RECOMMENDATIONS
// ============================================

/**
 * Source of a recommendation
 */
export type RecommendationSource =
  | 'liked_similar'      // Similar to content user liked
  | 'genre_fans'         // Popular among fans of user's top genres
  | 'actor_match'        // Features actor user likes
  | 'director_match'     // From director user likes
  | 'trending'           // Trending content
  | 'new_release'        // Recent releases matching preferences
  | 'mood_based'         // Based on time-of-day patterns
  | 'hidden_gem'         // High quality but less popular
  | 'exploration';       // Expand taste beyond comfort zone

/**
 * User analytics for detailed insights
 */
export interface UserAnalytics {
  userId: string;
  generatedAt: Date;

  // Swipe stats
  swipeStats: {
    totalSwipes: number;
    totalLikes: number;
    totalDislikes: number;
    likeRate: number;
    avgSwipesPerDay: number;
    longestStreak: number;
    currentStreak: number;
    firstSwipeDate: Date | null;
  };

  // Genre insights
  genreInsights: {
    topGenres: Array<{ id: number; name: string; score: number; likeCount: number; percentage: number }>;
    avoidedGenres: Array<{ id: number; name: string; dislikeRate: number }>;
    genreExplorationScore: number; // 0-100: how diverse are genre preferences
  };

  // Viewing patterns
  viewingPatterns: {
    peakHours: number[];
    peakDays: number[];
    avgViewDuration: number;
    quickDecisionRate: number; // % of swipes under 2 seconds
    deliberateDecisionRate: number; // % of swipes over 5 seconds
    timeOfDayPreferences: Record<'morning' | 'afternoon' | 'evening' | 'night', {
      swipeCount: number;
      likeRate: number;
      topGenre: string | null;
    }>;
  };

  // Content preferences
  contentPreferences: {
    avgRatingLiked: number;
    avgRatingDisliked: number;
    preferredDecades: Array<{ decade: number; percentage: number }>;
    preferredLanguages: Array<{ language: string; percentage: number }>;
    avgRuntimePreferred: number;
    movieVsTvRatio: { movies: number; tv: number };
  };

  // People preferences
  peoplePreferences: {
    topActors: Array<{ id: number; name: string; movieCount: number; score: number }>;
    topDirectors: Array<{ id: number; name: string; movieCount: number; score: number }>;
  };

  // AI insights
  aiInsights: {
    confidence: 'low' | 'medium' | 'high';
    tasteMaturity: 'new' | 'developing' | 'established' | 'refined';
    predictabilityScore: number; // How predictable are user's choices
    explorationWillingness: number; // How often user likes outside comfort zone
    qualityVsPopularity: 'quality_seeker' | 'mainstream' | 'balanced';
    moodProfile: string; // e.g., "Night owl thriller fan"
  };
}

/**
 * Detailed explanation for a recommendation
 */
export interface RecommendationExplanation {
  text: string;              // Human-readable: "Because you liked Inception"
  type: RecommendationSource;

  // For "Because you liked X"
  relatedContentId?: number;
  relatedContentTitle?: string;

  // For genre/actor/director matches
  matchedEntityType?: 'genre' | 'actor' | 'director';
  matchedEntityId?: number;
  matchedEntityName?: string;

  // For "Popular with X fans"
  fanGenreId?: number;
  fanGenreName?: string;
}

/**
 * A single recommendation item
 */
export interface Recommendation {
  contentId: number;
  contentType: 'movie' | 'tv';
  score: number;             // 0-1 recommendation strength
  source: RecommendationSource;
  explanation: RecommendationExplanation;

  // Content data for display
  title: string;
  posterPath: string;
  releaseYear: number;
  voteAverage: number;
  genreIds: number[];
}

/**
 * Cached recommendations for a user
 */
export interface UserRecommendations {
  userId: string;
  recommendations: Recommendation[];
  generatedAt: Date | Timestamp;
  expiresAt: Date | Timestamp;
  version: number;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Parameters for generating recommendations
 */
export interface RecommendationParams {
  userId: string;
  limit?: number;
  excludeIds?: number[];     // Content IDs to exclude (already swiped)
  sources?: RecommendationSource[];  // Specific sources to include
}

/**
 * Result of recommendation generation
 */
export interface RecommendationResult {
  recommendations: Recommendation[];
  fromCache: boolean;
  generatedAt: Date;
}

/**
 * Genre info for display
 */
export interface GenreInfo {
  id: number;
  name: string;
}

// Genre mappings (TMDB genre IDs)
export const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV genres
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

/**
 * Get time of day category
 */
export function getTimeOfDay(): SwipeContext['timeOfDay'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Create default empty taste profile
 */
export function createEmptyTasteProfile(userId: string): UserTasteProfile {
  return {
    userId,
    updatedAt: new Date(),
    genreAffinities: {},
    actorAffinities: {},
    directorAffinities: {},
    keywordAffinities: {},
    preferences: {
      avgRatingLiked: 7.0,
      avgYearLiked: 2020,
      avgRuntimeLiked: 120,
      avgPopularityLiked: 50,
      preferredDecades: [],
      preferredLanguages: ['en'],
    },
    behavior: {
      avgViewDurationLiked: 3000,
      avgViewDurationDisliked: 1500,
      peakSwipeHours: [],
      swipeVelocityPattern: 'mixed',
      totalSwipes: 0,
      totalLikes: 0,
    },
    recentLikedIds: [],
    recentDislikedIds: [],
  };
}

/**
 * Create default engagement metrics
 */
export function createDefaultEngagement(): SwipeEngagement {
  return {
    viewDurationMs: 0,
    swipeVelocity: 0,
    swipeDistance: 0,
    cardExpanded: false,
    trailerWatched: false,
  };
}

/**
 * Create swipe context
 */
export function createSwipeContext(sessionPosition: number): SwipeContext {
  return {
    sessionPosition,
    timeOfDay: getTimeOfDay(),
    dayOfWeek: new Date().getDay(),
  };
}
