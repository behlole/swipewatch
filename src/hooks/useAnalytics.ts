import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../features/auth/stores/authStore';
import { generateUserAnalytics } from '../services/analytics';
import { UserAnalytics } from '../types/recommendations';

interface AnalyticsState {
  analytics: UserAnalytics | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage user analytics
 */
export function useAnalytics() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const [state, setState] = useState<AnalyticsState>({
    analytics: null,
    isLoading: true,
    error: null,
  });

  const fetchAnalytics = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setState({
        analytics: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const analytics = await generateUserAnalytics(firebaseUser.uid);
      setState({
        analytics,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState({
        analytics: null,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to generate analytics'),
      });
    }
  }, [firebaseUser?.uid]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    ...state,
    refresh: fetchAnalytics,
  };
}

/**
 * Helper function to format numbers with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Get day name from day number
 */
export function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || '';
}

/**
 * Get short day name from day number
 */
export function getShortDayName(day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day] || '';
}

/**
 * Format hour to readable time
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get time of day label
 */
export function getTimeOfDayLabel(key: string): string {
  const labels: Record<string, string> = {
    morning: 'Morning (5AM-12PM)',
    afternoon: 'Afternoon (12PM-5PM)',
    evening: 'Evening (5PM-9PM)',
    night: 'Night (9PM-5AM)',
  };
  return labels[key] || key;
}

/**
 * Get confidence color
 */
export function getConfidenceColor(confidence: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: '#F59E0B',
    medium: '#8B5CF6',
    high: '#10B981',
  };
  return colors[confidence];
}

/**
 * Get maturity label
 */
export function getMaturityLabel(maturity: string): string {
  const labels: Record<string, string> = {
    new: 'Just Getting Started',
    developing: 'Developing Taste',
    established: 'Established Preferences',
    refined: 'Refined Connoisseur',
  };
  return labels[maturity] || maturity;
}
