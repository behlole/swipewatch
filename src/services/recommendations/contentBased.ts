import {
  UserTasteProfile,
  Recommendation,
  RecommendationExplanation,
  GENRE_NAMES,
  getTimeOfDay,
} from '../../types/recommendations';
import { Media } from '../../types';
import { discoverMovies, discoverTV, getMovieDetails, getTVDetails } from '../tmdb';
import { getTopGenres, getTopActors, getTopDirectors } from '../firebase/tasteProfile';

// ============================================
// ENHANCED SCORING SYSTEM
// ============================================

/**
 * Calculate temporal decay - recent likes matter more
 * Returns multiplier between 0.5 and 1.0
 */
function getTemporalDecay(index: number, totalItems: number): number {
  // First item (most recent) gets 1.0, last item gets 0.5
  return 1 - (index / totalItems) * 0.5;
}

/**
 * Calculate engagement-weighted score
 * Users who spend more time on content they like indicates stronger preference
 */
function getEngagementWeight(profile: UserTasteProfile): number {
  const avgLikedDuration = profile.behavior.avgViewDurationLiked;
  const avgDislikedDuration = profile.behavior.avgViewDurationDisliked;

  // If user spends much longer on liked content, they're deliberate
  if (avgLikedDuration > avgDislikedDuration * 1.5) {
    return 1.2; // Boost deliberate choices
  }
  return 1.0;
}

/**
 * Get mood-based genre preferences based on time of day
 */
function getMoodGenres(timeOfDay: ReturnType<typeof getTimeOfDay>): number[] {
  const moodGenres: Record<typeof timeOfDay, number[]> = {
    morning: [35, 10751, 16], // Comedy, Family, Animation
    afternoon: [28, 12, 878], // Action, Adventure, Sci-Fi
    evening: [18, 10749, 9648], // Drama, Romance, Mystery
    night: [27, 53, 80], // Horror, Thriller, Crime
  };
  return moodGenres[timeOfDay] || [];
}

/**
 * Calculate exploration score - how much content differs from user's usual taste
 */
function calculateExplorationScore(
  movie: { genre_ids?: number[]; vote_average: number },
  profile: UserTasteProfile
): number {
  const movieGenres = movie.genre_ids || [];
  let familiarGenres = 0;

  for (const genreId of movieGenres) {
    if (profile.genreAffinities[genreId]?.likeCount > 0) {
      familiarGenres++;
    }
  }

  // Content with some familiar and some new genres = best exploration
  const familiarRatio = movieGenres.length > 0 ? familiarGenres / movieGenres.length : 0;

  // Sweet spot: 30-70% familiar
  if (familiarRatio >= 0.3 && familiarRatio <= 0.7) {
    return 1.2; // Boost exploration content
  }
  return 1.0;
}

// ============================================
// CONTENT-BASED RECOMMENDATIONS
// ============================================

/**
 * Get personalized discover params based on taste profile
 */
export function getPersonalizedDiscoverParams(
  profile: UserTasteProfile,
  baseFilters: {
    contentType?: 'movie' | 'tv' | 'both';
    minRating?: number;
    minYear?: number;
    maxYear?: number;
  } = {}
): Record<string, any> {
  const params: Record<string, any> = {
    'vote_count.gte': 100,
    'vote_average.gte': baseFilters.minRating || Math.max(profile.preferences.avgRatingLiked - 1, 5),
  };

  // Get top genres and use them for filtering
  const topGenres = getTopGenres(profile, 3);
  if (topGenres.length > 0) {
    // Use OR logic for genres (any of the top genres)
    params.with_genres = topGenres.map(g => g.id).join('|');
  }

  // Use preferred decades for year filtering
  if (profile.preferences.preferredDecades.length > 0) {
    const recentDecade = Math.max(...profile.preferences.preferredDecades);
    params['primary_release_date.gte'] = `${recentDecade}-01-01`;
  } else if (baseFilters.minYear) {
    params['primary_release_date.gte'] = `${baseFilters.minYear}-01-01`;
  }

  if (baseFilters.maxYear) {
    params['primary_release_date.lte'] = `${baseFilters.maxYear}-12-31`;
  }

  return params;
}

/**
 * Generate "Because you liked X" recommendations with temporal decay
 */
export async function getSimilarToLiked(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get recently liked content IDs - more items for better diversity
  const recentLikedIds = profile.recentLikedIds.slice(0, 8);
  const totalLiked = recentLikedIds.length;

  for (let i = 0; i < recentLikedIds.length; i++) {
    const contentId = recentLikedIds[i];
    if (recommendations.length >= limit) break;

    // Temporal decay: recent likes get more similar content
    const temporalWeight = getTemporalDecay(i, totalLiked);
    const maxFromThis = Math.max(1, Math.ceil(3 * temporalWeight));

    try {
      const details = await getMovieDetails(contentId);
      const similar = details.recommendations?.results || [];

      let addedFromThis = 0;
      for (const movie of similar) {
        if (addedFromThis >= maxFromThis) break;
        if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
          continue;
        }

        const explanation: RecommendationExplanation = {
          text: `Because you liked "${details.title}"`,
          type: 'liked_similar',
          relatedContentId: contentId,
          relatedContentTitle: details.title,
        };

        recommendations.push({
          contentId: movie.id,
          contentType: 'movie',
          score: calculateSimilarityScore(movie, profile, { temporalWeight }),
          source: 'liked_similar',
          explanation,
          title: movie.title,
          posterPath: movie.poster_path || '',
          releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
          voteAverage: movie.vote_average,
          genreIds: movie.genre_ids || [],
        });

        addedFromThis++;
        if (recommendations.length >= limit) break;
      }
    } catch (error) {
      console.warn(`Failed to get similar movies for ${contentId}:`, error);
    }
  }

  return recommendations;
}

/**
 * Generate actor-based recommendations
 */
export async function getActorBasedRecommendations(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const topActors = getTopActors(profile, 3);

  for (const actor of topActors) {
    if (recommendations.length >= limit) break;

    try {
      // Discover movies with this actor
      const params = {
        with_cast: actor.id.toString(),
        'vote_average.gte': Math.max(profile.preferences.avgRatingLiked - 1, 5.5),
        'vote_count.gte': 100,
        sort_by: 'vote_average.desc',
        page: 1,
      };

      const response = await discoverMovies(params);

      for (const movie of response.results.slice(0, 4)) {
        if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
          continue;
        }

        const explanation: RecommendationExplanation = {
          text: `Starring ${actor.name}`,
          type: 'actor_match',
          matchedEntityType: 'actor',
          matchedEntityId: actor.id,
          matchedEntityName: actor.name,
        };

        recommendations.push({
          contentId: movie.id,
          contentType: 'movie',
          score: calculateSimilarityScore(movie, profile) * (actor.score + 0.2),
          source: 'actor_match',
          explanation,
          title: movie.title,
          posterPath: movie.poster_path || '',
          releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
          voteAverage: movie.vote_average,
          genreIds: movie.genre_ids || [],
        });

        if (recommendations.length >= limit) break;
      }
    } catch (error) {
      console.warn(`Failed to get actor recommendations for ${actor.name}:`, error);
    }
  }

  return recommendations;
}

/**
 * Generate director-based recommendations
 */
export async function getDirectorBasedRecommendations(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const topDirectors = getTopDirectors(profile, 3);

  for (const director of topDirectors) {
    if (recommendations.length >= limit) break;

    try {
      const params = {
        with_crew: director.id.toString(),
        'vote_average.gte': Math.max(profile.preferences.avgRatingLiked - 1, 5.5),
        'vote_count.gte': 50,
        sort_by: 'vote_average.desc',
        page: 1,
      };

      const response = await discoverMovies(params);

      for (const movie of response.results.slice(0, 4)) {
        if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
          continue;
        }

        const explanation: RecommendationExplanation = {
          text: `Directed by ${director.name}`,
          type: 'director_match',
          matchedEntityType: 'director',
          matchedEntityId: director.id,
          matchedEntityName: director.name,
        };

        recommendations.push({
          contentId: movie.id,
          contentType: 'movie',
          score: calculateSimilarityScore(movie, profile) * (director.score + 0.3),
          source: 'director_match',
          explanation,
          title: movie.title,
          posterPath: movie.poster_path || '',
          releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
          voteAverage: movie.vote_average,
          genreIds: movie.genre_ids || [],
        });

        if (recommendations.length >= limit) break;
      }
    } catch (error) {
      console.warn(`Failed to get director recommendations for ${director.name}:`, error);
    }
  }

  return recommendations;
}

/**
 * Generate mood-based recommendations based on time of day
 */
export async function getMoodBasedRecommendations(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const timeOfDay = getTimeOfDay();
  const moodGenres = getMoodGenres(timeOfDay);

  // Combine mood genres with user's top genres
  const topGenres = getTopGenres(profile, 2);
  const combinedGenres = [...new Set([...moodGenres.slice(0, 2), ...topGenres.map(g => g.id)])];

  const moodDescriptions: Record<typeof timeOfDay, string> = {
    morning: 'Perfect for your morning',
    afternoon: 'Great for an afternoon watch',
    evening: 'Ideal for tonight',
    night: 'Perfect late-night pick',
  };

  try {
    const params = {
      with_genres: combinedGenres.slice(0, 3).join('|'),
      'vote_average.gte': 6.5,
      'vote_count.gte': 200,
      sort_by: 'popularity.desc',
      page: 1,
    };

    const response = await discoverMovies(params);

    for (const movie of response.results) {
      if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
        continue;
      }

      const explanation: RecommendationExplanation = {
        text: moodDescriptions[timeOfDay],
        type: 'mood_based',
      };

      recommendations.push({
        contentId: movie.id,
        contentType: 'movie',
        score: calculateSimilarityScore(movie, profile, { isMoodBased: true }),
        source: 'mood_based',
        explanation,
        title: movie.title,
        posterPath: movie.poster_path || '',
        releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
        voteAverage: movie.vote_average,
        genreIds: movie.genre_ids || [],
      });

      if (recommendations.length >= limit) break;
    }
  } catch (error) {
    console.warn('Failed to get mood-based recommendations:', error);
  }

  return recommendations;
}

/**
 * Generate hidden gem recommendations - high quality but less popular
 */
export async function getHiddenGemRecommendations(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const topGenres = getTopGenres(profile, 3);

  try {
    const params = {
      with_genres: topGenres.map(g => g.id).join('|'),
      'vote_average.gte': 7.5,
      'vote_count.gte': 50,
      'vote_count.lte': 500, // Less popular = hidden gem
      sort_by: 'vote_average.desc',
      page: 1,
    };

    const response = await discoverMovies(params);

    for (const movie of response.results) {
      if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
        continue;
      }

      const explanation: RecommendationExplanation = {
        text: 'Hidden gem you might love',
        type: 'hidden_gem',
      };

      recommendations.push({
        contentId: movie.id,
        contentType: 'movie',
        score: calculateSimilarityScore(movie, profile) * 1.1, // Slight boost for hidden gems
        source: 'hidden_gem',
        explanation,
        title: movie.title,
        posterPath: movie.poster_path || '',
        releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
        voteAverage: movie.vote_average,
        genreIds: movie.genre_ids || [],
      });

      if (recommendations.length >= limit) break;
    }
  } catch (error) {
    console.warn('Failed to get hidden gem recommendations:', error);
  }

  return recommendations;
}

/**
 * Generate exploration recommendations - expand user's taste
 */
export async function getExplorationRecommendations(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Find genres user hasn't explored much
  const allGenreIds = Object.keys(GENRE_NAMES).map(Number);
  const exploredGenres = Object.keys(profile.genreAffinities).map(Number);
  const unexploredGenres = allGenreIds.filter(
    g => !exploredGenres.includes(g) || profile.genreAffinities[g]?.likeCount < 2
  );

  if (unexploredGenres.length === 0) {
    return recommendations;
  }

  try {
    // Pick a random unexplored genre but combine with a liked genre
    const topGenres = getTopGenres(profile, 1);
    const randomUnexplored = unexploredGenres[Math.floor(Math.random() * unexploredGenres.length)];
    const combineWith = topGenres.length > 0 ? topGenres[0].id : null;

    const genreFilter = combineWith
      ? `${randomUnexplored},${combineWith}`
      : randomUnexplored.toString();

    const params = {
      with_genres: genreFilter,
      'vote_average.gte': 7.0,
      'vote_count.gte': 300,
      sort_by: 'vote_average.desc',
      page: 1,
    };

    const response = await discoverMovies(params);
    const unexploredGenreName = GENRE_NAMES[randomUnexplored] || 'something new';

    for (const movie of response.results) {
      if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
        continue;
      }

      const explanation: RecommendationExplanation = {
        text: `Try ${unexploredGenreName}`,
        type: 'exploration',
        matchedEntityType: 'genre',
        matchedEntityId: randomUnexplored,
        matchedEntityName: unexploredGenreName,
      };

      recommendations.push({
        contentId: movie.id,
        contentType: 'movie',
        score: calculateSimilarityScore(movie, profile, { isExploration: true }),
        source: 'exploration',
        explanation,
        title: movie.title,
        posterPath: movie.poster_path || '',
        releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
        voteAverage: movie.vote_average,
        genreIds: movie.genre_ids || [],
      });

      if (recommendations.length >= limit) break;
    }
  } catch (error) {
    console.warn('Failed to get exploration recommendations:', error);
  }

  return recommendations;
}

/**
 * Generate genre-based recommendations
 */
export async function getGenreBasedRecommendations(
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const topGenres = getTopGenres(profile, 3);

  for (const genre of topGenres) {
    if (recommendations.length >= limit) break;

    try {
      const params = {
        with_genres: genre.id.toString(),
        'vote_average.gte': profile.preferences.avgRatingLiked - 0.5,
        'vote_count.gte': 200,
        sort_by: 'popularity.desc',
        page: 1,
      };

      const response = await discoverMovies(params);

      for (const movie of response.results.slice(0, 5)) {
        if (excludeIds.has(movie.id) || recommendations.some(r => r.contentId === movie.id)) {
          continue;
        }

        const explanation: RecommendationExplanation = {
          text: `Matches your love of ${genre.name}`,
          type: 'genre_fans',
          matchedEntityType: 'genre',
          matchedEntityId: genre.id,
          matchedEntityName: genre.name,
        };

        recommendations.push({
          contentId: movie.id,
          contentType: 'movie',
          score: genre.score * (movie.vote_average / 10),
          source: 'genre_fans',
          explanation,
          title: movie.title,
          posterPath: movie.poster_path || '',
          releaseYear: new Date(movie.release_date || '').getFullYear() || 0,
          voteAverage: movie.vote_average,
          genreIds: movie.genre_ids || [],
        });

        if (recommendations.length >= limit) break;
      }
    } catch (error) {
      console.warn(`Failed to get genre recommendations for ${genre.name}:`, error);
    }
  }

  return recommendations;
}

/**
 * Enhanced similarity score with multiple factors
 */
function calculateSimilarityScore(
  movie: {
    vote_average: number;
    genre_ids?: number[];
    popularity?: number;
    release_date?: string;
  },
  profile: UserTasteProfile,
  options: {
    temporalWeight?: number;
    isMoodBased?: boolean;
    isExploration?: boolean;
  } = {}
): number {
  const { temporalWeight = 1.0, isMoodBased = false, isExploration = false } = options;

  let weightedScore = 0;
  let totalWeight = 0;

  // 1. Genre affinity (weight: 35%)
  const movieGenres = movie.genre_ids || [];
  let genreScore = 0;
  let genreMatches = 0;

  for (const genreId of movieGenres) {
    const affinity = profile.genreAffinities[genreId];
    if (affinity && affinity.likeCount > 0) {
      genreScore += affinity.score;
      genreMatches++;
    }
  }

  if (genreMatches > 0) {
    weightedScore += (genreScore / genreMatches) * 0.35;
    totalWeight += 0.35;
  }

  // 2. Rating proximity (weight: 20%)
  const ratingDiff = Math.abs(movie.vote_average - profile.preferences.avgRatingLiked);
  const ratingScore = Math.max(0, 1 - ratingDiff / 4); // Normalized
  weightedScore += ratingScore * 0.20;
  totalWeight += 0.20;

  // 3. Quality bonus for high-rated content (weight: 15%)
  const qualityScore = movie.vote_average >= 7.5 ? 1 : movie.vote_average / 7.5;
  weightedScore += qualityScore * 0.15;
  totalWeight += 0.15;

  // 4. Popularity balance (weight: 10%)
  // Slight preference for popular content but don't overwhelm with mainstream
  const popularity = movie.popularity || 50;
  const popularityScore = Math.min(popularity / 100, 1) * 0.7 + 0.3; // 0.3 to 1.0
  weightedScore += popularityScore * 0.10;
  totalWeight += 0.10;

  // 5. Release year preference (weight: 10%)
  if (movie.release_date && profile.preferences.preferredDecades.length > 0) {
    const movieYear = new Date(movie.release_date).getFullYear();
    const movieDecade = Math.floor(movieYear / 10) * 10;
    const decadeMatch = profile.preferences.preferredDecades.includes(movieDecade);
    const yearScore = decadeMatch ? 1 : 0.6;
    weightedScore += yearScore * 0.10;
    totalWeight += 0.10;
  }

  // 6. Mood alignment bonus (weight: 10% when applicable)
  if (isMoodBased) {
    const moodGenres = getMoodGenres(getTimeOfDay());
    const moodMatch = movieGenres.some(g => moodGenres.includes(g));
    if (moodMatch) {
      weightedScore += 1.0 * 0.10;
      totalWeight += 0.10;
    }
  }

  // Calculate base score
  let finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0.5;

  // Apply multipliers
  finalScore *= temporalWeight;
  finalScore *= getEngagementWeight(profile);

  if (isExploration) {
    finalScore *= calculateExplorationScore(movie, profile);
  }

  // Clamp to 0-1 range
  return Math.min(1, Math.max(0, finalScore));
}

/**
 * Get "More Like This" recommendations for a specific piece of content
 */
export async function getMoreLikeThis(
  contentId: number,
  contentType: 'movie' | 'tv',
  profile: UserTasteProfile,
  excludeIds: Set<number>,
  limit: number = 10
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  try {
    let details: any;
    let sourceTitle: string;

    if (contentType === 'movie') {
      details = await getMovieDetails(contentId);
      sourceTitle = details.title;
    } else {
      details = await getTVDetails(contentId);
      sourceTitle = details.name;
    }

    const similar = details.recommendations?.results || [];

    for (const item of similar) {
      if (excludeIds.has(item.id) || recommendations.some(r => r.contentId === item.id)) {
        continue;
      }

      const explanation: RecommendationExplanation = {
        text: `Similar to "${sourceTitle}"`,
        type: 'liked_similar',
        relatedContentId: contentId,
        relatedContentTitle: sourceTitle,
      };

      recommendations.push({
        contentId: item.id,
        contentType,
        score: calculateSimilarityScore(item, profile),
        source: 'liked_similar',
        explanation,
        title: contentType === 'movie' ? item.title : item.name,
        posterPath: item.poster_path || '',
        releaseYear: new Date(
          contentType === 'movie' ? item.release_date : item.first_air_date || ''
        ).getFullYear() || 0,
        voteAverage: item.vote_average,
        genreIds: item.genre_ids || [],
      });

      if (recommendations.length >= limit) break;
    }
  } catch (error) {
    console.warn(`Failed to get similar content for ${contentId}:`, error);
  }

  return recommendations;
}
