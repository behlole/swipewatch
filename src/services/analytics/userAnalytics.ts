import {
  UserTasteProfile,
  UserAnalytics,
  GENRE_NAMES,
  getTimeOfDay,
} from '../../types/recommendations';
import { getTasteProfile, getRecommendationConfidence } from '../firebase/tasteProfile';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { collections } from '../firebase/constants';

// ============================================
// USER ANALYTICS GENERATION
// ============================================

/**
 * Generate comprehensive user analytics
 */
export async function generateUserAnalytics(userId: string): Promise<UserAnalytics> {
  const profile = await getTasteProfile(userId);
  const swipeHistory = await getSwipeHistory(userId, 500);

  const analytics: UserAnalytics = {
    userId,
    generatedAt: new Date(),
    swipeStats: calculateSwipeStats(profile, swipeHistory),
    genreInsights: calculateGenreInsights(profile),
    viewingPatterns: calculateViewingPatterns(profile, swipeHistory),
    contentPreferences: calculateContentPreferences(profile),
    peoplePreferences: calculatePeoplePreferences(profile),
    aiInsights: calculateAIInsights(profile, swipeHistory),
  };

  return analytics;
}

/**
 * Fetch user's swipe history
 */
async function getSwipeHistory(userId: string, maxItems: number = 500): Promise<any[]> {
  try {
    const swipesRef = collection(db, collections.swipes);
    const q = query(
      swipesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.warn('Failed to fetch swipe history:', error);
    return [];
  }
}

/**
 * Calculate swipe statistics
 */
function calculateSwipeStats(
  profile: UserTasteProfile,
  swipeHistory: any[]
): UserAnalytics['swipeStats'] {
  const totalSwipes = profile.behavior.totalSwipes;
  const totalLikes = profile.behavior.totalLikes;
  const totalDislikes = totalSwipes - totalLikes;
  const likeRate = totalSwipes > 0 ? Math.round((totalLikes / totalSwipes) * 100) : 0;

  // Calculate streaks and averages
  let firstSwipeDate: Date | null = null;
  let avgSwipesPerDay = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  if (swipeHistory.length > 0) {
    firstSwipeDate = swipeHistory[swipeHistory.length - 1]?.createdAt || null;

    if (firstSwipeDate) {
      const daysSinceFirst = Math.max(1, Math.ceil(
        (new Date().getTime() - firstSwipeDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
      avgSwipesPerDay = Math.round((totalSwipes / daysSinceFirst) * 10) / 10;
    }

    // Calculate streaks
    const swipesByDay = new Map<string, number>();
    for (const swipe of swipeHistory) {
      const dateKey = swipe.createdAt.toISOString().split('T')[0];
      swipesByDay.set(dateKey, (swipesByDay.get(dateKey) || 0) + 1);
    }

    const sortedDays = Array.from(swipesByDay.keys()).sort();
    let streak = 0;
    let prevDate: Date | null = null;

    for (const dayStr of sortedDays) {
      const date = new Date(dayStr);
      if (prevDate) {
        const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
        }
      } else {
        streak = 1;
      }
      prevDate = date;
    }
    longestStreak = Math.max(longestStreak, streak);

    // Current streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (swipesByDay.has(today)) {
      currentStreak = 1;
      let checkDate = new Date(Date.now() - 86400000);
      while (swipesByDay.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      }
    } else if (swipesByDay.has(yesterday)) {
      currentStreak = 1;
      let checkDate = new Date(Date.now() - 2 * 86400000);
      while (swipesByDay.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      }
    }
  }

  return {
    totalSwipes,
    totalLikes,
    totalDislikes,
    likeRate,
    avgSwipesPerDay,
    longestStreak,
    currentStreak,
    firstSwipeDate,
  };
}

/**
 * Calculate genre insights
 */
function calculateGenreInsights(profile: UserTasteProfile): UserAnalytics['genreInsights'] {
  const genreEntries = Object.entries(profile.genreAffinities);

  // Top genres
  const topGenres = genreEntries
    .filter(([_, affinity]) => affinity.likeCount > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map(([id, affinity]) => {
      const totalInteractions = affinity.likeCount + affinity.dislikeCount;
      return {
        id: parseInt(id),
        name: GENRE_NAMES[parseInt(id)] || 'Unknown',
        score: affinity.score,
        likeCount: affinity.likeCount,
        percentage: Math.round(affinity.score * 100),
      };
    });

  // Avoided genres (high dislike rate)
  const avoidedGenres = genreEntries
    .filter(([_, affinity]) => {
      const total = affinity.likeCount + affinity.dislikeCount;
      return total >= 3 && affinity.dislikeCount > affinity.likeCount;
    })
    .map(([id, affinity]) => {
      const total = affinity.likeCount + affinity.dislikeCount;
      return {
        id: parseInt(id),
        name: GENRE_NAMES[parseInt(id)] || 'Unknown',
        dislikeRate: Math.round((affinity.dislikeCount / total) * 100),
      };
    })
    .sort((a, b) => b.dislikeRate - a.dislikeRate)
    .slice(0, 5);

  // Genre exploration score (how diverse)
  const totalGenresExplored = genreEntries.filter(([_, a]) => a.likeCount + a.dislikeCount >= 2).length;
  const totalGenres = Object.keys(GENRE_NAMES).length;
  const genreExplorationScore = Math.round((totalGenresExplored / totalGenres) * 100);

  return {
    topGenres,
    avoidedGenres,
    genreExplorationScore,
  };
}

/**
 * Calculate viewing patterns
 */
function calculateViewingPatterns(
  profile: UserTasteProfile,
  swipeHistory: any[]
): UserAnalytics['viewingPatterns'] {
  const peakHours = profile.behavior.peakSwipeHours.slice(0, 5);
  const avgViewDuration = Math.round(profile.behavior.avgViewDurationLiked);

  // Analyze swipe history for patterns
  const hourCounts: Record<number, { total: number; likes: number }> = {};
  const dayCounts: Record<number, number> = {};
  const timeOfDayStats: Record<string, { swipeCount: number; likes: number; genres: Record<number, number> }> = {
    morning: { swipeCount: 0, likes: 0, genres: {} },
    afternoon: { swipeCount: 0, likes: 0, genres: {} },
    evening: { swipeCount: 0, likes: 0, genres: {} },
    night: { swipeCount: 0, likes: 0, genres: {} },
  };

  let quickDecisions = 0;
  let deliberateDecisions = 0;

  for (const swipe of swipeHistory) {
    const date = swipe.createdAt;
    const hour = date.getHours();
    const day = date.getDay();

    // Hour stats
    if (!hourCounts[hour]) hourCounts[hour] = { total: 0, likes: 0 };
    hourCounts[hour].total++;
    if (swipe.direction === 'right') hourCounts[hour].likes++;

    // Day stats
    dayCounts[day] = (dayCounts[day] || 0) + 1;

    // Time of day stats
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    timeOfDayStats[timeOfDay].swipeCount++;
    if (swipe.direction === 'right') {
      timeOfDayStats[timeOfDay].likes++;
      // Track genres for this time
      const genres = swipe.features?.genreIds || [];
      for (const g of genres) {
        timeOfDayStats[timeOfDay].genres[g] = (timeOfDayStats[timeOfDay].genres[g] || 0) + 1;
      }
    }

    // Decision speed
    const viewDuration = swipe.engagement?.viewDurationMs || 0;
    if (viewDuration < 2000) quickDecisions++;
    else if (viewDuration > 5000) deliberateDecisions++;
  }

  // Find peak days
  const peakDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => parseInt(day));

  // Calculate time of day preferences
  const timeOfDayPreferences: UserAnalytics['viewingPatterns']['timeOfDayPreferences'] = {
    morning: calculateTimeOfDayPref(timeOfDayStats.morning),
    afternoon: calculateTimeOfDayPref(timeOfDayStats.afternoon),
    evening: calculateTimeOfDayPref(timeOfDayStats.evening),
    night: calculateTimeOfDayPref(timeOfDayStats.night),
  };

  const totalWithDuration = quickDecisions + deliberateDecisions;

  return {
    peakHours,
    peakDays,
    avgViewDuration,
    quickDecisionRate: totalWithDuration > 0 ? Math.round((quickDecisions / totalWithDuration) * 100) : 0,
    deliberateDecisionRate: totalWithDuration > 0 ? Math.round((deliberateDecisions / totalWithDuration) * 100) : 0,
    timeOfDayPreferences,
  };
}

function calculateTimeOfDayPref(stats: { swipeCount: number; likes: number; genres: Record<number, number> }) {
  const topGenreId = Object.entries(stats.genres)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    swipeCount: stats.swipeCount,
    likeRate: stats.swipeCount > 0 ? Math.round((stats.likes / stats.swipeCount) * 100) : 0,
    topGenre: topGenreId ? GENRE_NAMES[parseInt(topGenreId)] || null : null,
  };
}

/**
 * Calculate content preferences
 */
function calculateContentPreferences(profile: UserTasteProfile): UserAnalytics['contentPreferences'] {
  const avgRatingLiked = Math.round(profile.preferences.avgRatingLiked * 10) / 10;
  const avgRatingDisliked = 5.5; // Default estimate

  // Decade distribution
  const decades = profile.preferences.preferredDecades;
  const decadeTotal = decades.length || 1;
  const preferredDecades = decades.slice(0, 5).map((decade, i) => ({
    decade,
    percentage: Math.round((1 - i * 0.2) * 100 / decadeTotal),
  }));

  // Language preferences
  const languages = profile.preferences.preferredLanguages || ['en'];
  const preferredLanguages = languages.map((lang, i) => ({
    language: getLanguageName(lang),
    percentage: Math.round(100 / (i + 1)),
  }));

  return {
    avgRatingLiked,
    avgRatingDisliked,
    preferredDecades,
    preferredLanguages,
    avgRuntimePreferred: Math.round(profile.preferences.avgRuntimeLiked),
    movieVsTvRatio: { movies: 80, tv: 20 }, // Default estimate
  };
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    hi: 'Hindi',
    pt: 'Portuguese',
  };
  return names[code] || code.toUpperCase();
}

/**
 * Calculate people preferences
 */
function calculatePeoplePreferences(profile: UserTasteProfile): UserAnalytics['peoplePreferences'] {
  const topActors = Object.entries(profile.actorAffinities)
    .filter(([_, a]) => a.interactionCount >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map(([id, affinity]) => ({
      id: parseInt(id),
      name: affinity.name,
      movieCount: affinity.interactionCount,
      score: Math.round(affinity.score * 100),
    }));

  const topDirectors = Object.entries(profile.directorAffinities)
    .filter(([_, a]) => a.interactionCount >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map(([id, affinity]) => ({
      id: parseInt(id),
      name: affinity.name,
      movieCount: affinity.interactionCount,
      score: Math.round(affinity.score * 100),
    }));

  return { topActors, topDirectors };
}

/**
 * Calculate AI insights
 */
function calculateAIInsights(
  profile: UserTasteProfile,
  swipeHistory: any[]
): UserAnalytics['aiInsights'] {
  const confidence = getRecommendationConfidence(profile);
  const totalLikes = profile.behavior.totalLikes;

  // Taste maturity
  let tasteMaturity: UserAnalytics['aiInsights']['tasteMaturity'];
  if (totalLikes < 5) tasteMaturity = 'new';
  else if (totalLikes < 20) tasteMaturity = 'developing';
  else if (totalLikes < 50) tasteMaturity = 'established';
  else tasteMaturity = 'refined';

  // Predictability score (based on genre consistency)
  const genreAffinities = Object.values(profile.genreAffinities);
  const highAffinityGenres = genreAffinities.filter(a => a.score > 0.7).length;
  const predictabilityScore = Math.min(100, Math.round((highAffinityGenres / 5) * 100));

  // Exploration willingness
  const totalGenres = Object.keys(profile.genreAffinities).length;
  const exploredGenres = genreAffinities.filter(a => a.likeCount + a.dislikeCount >= 3).length;
  const explorationWillingness = totalGenres > 0 ? Math.round((exploredGenres / totalGenres) * 100) : 50;

  // Quality vs popularity preference
  const avgRating = profile.preferences.avgRatingLiked;
  const avgPopularity = profile.preferences.avgPopularityLiked;
  let qualityVsPopularity: UserAnalytics['aiInsights']['qualityVsPopularity'];
  if (avgRating >= 7.5 && avgPopularity < 50) qualityVsPopularity = 'quality_seeker';
  else if (avgRating < 7 && avgPopularity > 70) qualityVsPopularity = 'mainstream';
  else qualityVsPopularity = 'balanced';

  // Generate mood profile
  const moodProfile = generateMoodProfile(profile);

  return {
    confidence,
    tasteMaturity,
    predictabilityScore,
    explorationWillingness,
    qualityVsPopularity,
    moodProfile,
  };
}

/**
 * Generate a descriptive mood profile
 */
function generateMoodProfile(profile: UserTasteProfile): string {
  const topGenres = Object.entries(profile.genreAffinities)
    .filter(([_, a]) => a.score > 0.6)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 2)
    .map(([id]) => GENRE_NAMES[parseInt(id)]);

  const peakHours = profile.behavior.peakSwipeHours;
  const isNightOwl = peakHours.some(h => h >= 21 || h <= 3);
  const isEarlyBird = peakHours.some(h => h >= 5 && h <= 9);

  const timeLabel = isNightOwl ? 'Night owl' : isEarlyBird ? 'Early bird' : 'Anytime';

  if (topGenres.length === 0) {
    return 'Still discovering your taste';
  }

  const genreLabel = topGenres.join(' & ').toLowerCase();
  return `${timeLabel} ${genreLabel} enthusiast`;
}

