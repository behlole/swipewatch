import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../features/auth/stores/authStore';
import {
  getTasteProfile,
  getTopGenres,
  getTopActors,
  getTopDirectors,
  hasEnoughDataForRecommendations,
  getRecommendationConfidence,
} from '../services/firebase/tasteProfile';
import { UserTasteProfile } from '../types/recommendations';

interface TasteProfileState {
  profile: UserTasteProfile | null;
  isLoading: boolean;
  error: Error | null;
  topGenres: { id: number; name: string; score: number }[];
  topActors: { id: number; name: string; score: number }[];
  topDirectors: { id: number; name: string; score: number }[];
  hasEnoughData: boolean;
  confidence: 'low' | 'medium' | 'high';
}

export function useTasteProfile() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [state, setState] = useState<TasteProfileState>({
    profile: null,
    isLoading: true,
    error: null,
    topGenres: [],
    topActors: [],
    topDirectors: [],
    hasEnoughData: false,
    confidence: 'low',
  });

  const fetchProfile = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        profile: null,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const profile = await getTasteProfile(firebaseUser.uid);

      setState({
        profile,
        isLoading: false,
        error: null,
        topGenres: getTopGenres(profile, 5),
        topActors: getTopActors(profile, 5),
        topDirectors: getTopDirectors(profile, 5),
        hasEnoughData: hasEnoughDataForRecommendations(profile),
        confidence: getRecommendationConfidence(profile),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch taste profile'),
      }));
    }
  }, [firebaseUser?.uid]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    refresh: fetchProfile,
  };
}

/**
 * Get taste stats for display
 */
export function useTasteStats() {
  const { profile, topGenres, topActors, topDirectors, hasEnoughData, confidence, isLoading } =
    useTasteProfile();

  const stats = {
    totalSwipes: profile?.behavior.totalSwipes || 0,
    totalLikes: profile?.behavior.totalLikes || 0,
    likeRate: profile?.behavior.totalSwipes
      ? Math.round((profile.behavior.totalLikes / profile.behavior.totalSwipes) * 100)
      : 0,
    avgRatingLiked: profile?.preferences.avgRatingLiked?.toFixed(1) || 'N/A',
    preferredDecades: profile?.preferences.preferredDecades || [],
    topGenres,
    topActors,
    topDirectors,
  };

  return {
    stats,
    hasEnoughData,
    confidence,
    isLoading,
  };
}
