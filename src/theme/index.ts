import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

export { colors } from './colors';
export { typography } from './typography';
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
    background: typeof colors.dark.background;
    text: typeof colors.dark.text;
    border: typeof colors.dark.border;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' || colorScheme === null; // Default to dark

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

// Utility to get rating color based on score
export function getRatingColor(rating: number): string {
  if (rating >= 8) return colors.rating.excellent;
  if (rating >= 6) return colors.rating.good;
  if (rating >= 4) return colors.rating.average;
  return colors.rating.poor;
}
