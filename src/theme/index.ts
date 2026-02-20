import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography, fontWeights } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { usePreferencesStore } from '../stores/preferencesStore';

export { colors } from './colors';
export { typography, fontWeights } from './typography';
export type { TextVariant, FontWeight } from './typography';
export { spacing, borderRadius, shadows } from './spacing';

export interface Theme {
  colors: {
    primary: typeof colors.primary;
    accent: typeof colors.accent;
    success: string;
    warning: string;
    error: string;
    info: string;
    rating: typeof colors.rating;
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: {
      subtle: string;
      default: string;
      strong: string;
    };
  };
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

/**
 * Hook to access the current theme
 * Uses saved preference (dark/light/system); when system, follows device color scheme
 */
export function useTheme(): Theme {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const systemScheme = useColorScheme();
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && (systemScheme === 'dark' || systemScheme === null));

  const themeColors = isDark ? colors.dark : colors.light;

  return {
    colors: {
      primary: colors.primary,
      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      rating: colors.rating,
      background: themeColors.background,
      text: themeColors.text,
      border: themeColors.border,
    },
    typography,
    spacing,
    borderRadius,
    shadows,
    isDark,
  };
}

/**
 * Get rating color based on score (0-10 scale)
 */
export function getRatingColor(rating: number): string {
  if (rating >= 8) return colors.rating.excellent;
  if (rating >= 6) return colors.rating.good;
  if (rating >= 4) return colors.rating.average;
  return colors.rating.poor;
}

/**
 * Design system constants for quick reference
 */
export const designSystem = {
  // Screen padding
  screenPadding: spacing.screenPadding,

  // Common gaps
  sectionGap: spacing.sectionGap,
  listItemGap: spacing.listItemGap,

  // Card styling
  cardRadius: borderRadius.card,
  cardPadding: spacing.cardPadding,

  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  },

  // Opacity values
  opacity: {
    disabled: 0.5,
    pressed: 0.85,
    hover: 0.9,
    subtle: 0.6,
  },
} as const;
