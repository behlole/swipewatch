import { Platform, TextStyle } from 'react-native';

/**
 * SwipeWatch Design System - Typography
 *
 * Based on industry standards:
 * - Type scale: 1.25 ratio (Major Third)
 * - Line heights: 1.2 for headings, 1.5 for body
 * - Letter spacing: Tighter for large text, looser for small
 */

// Font family configuration
const fontFamily = Platform.select({
  ios: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    heavy: 'System',
  },
  android: {
    thin: 'Roboto',
    light: 'Roboto',
    regular: 'Roboto',
    medium: 'Roboto',
    semibold: 'Roboto',
    bold: 'Roboto',
    heavy: 'Roboto',
  },
  default: {
    thin: 'System',
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    heavy: 'System',
  },
});

// Font weights mapped to platform-specific values
export const fontWeights = {
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export type FontWeight = keyof typeof fontWeights;

// Base text styles with proper typographic scale
interface TextStyleDefinition {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing: number;
  fontFamily: string;
}

export const typography = {
  fontFamily: fontFamily!,

  sizes: {
    // Display - Hero text, large titles
    display1: {
      fontSize: 56,
      lineHeight: 64,
      fontWeight: fontWeights.bold,
      letterSpacing: -1.5,
      fontFamily: fontFamily!.bold,
    } as TextStyleDefinition,

    display2: {
      fontSize: 44,
      lineHeight: 52,
      fontWeight: fontWeights.bold,
      letterSpacing: -1,
      fontFamily: fontFamily!.bold,
    } as TextStyleDefinition,

    // Headings - Section titles
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: fontWeights.bold,
      letterSpacing: -0.5,
      fontFamily: fontFamily!.bold,
    } as TextStyleDefinition,

    h2: {
      fontSize: 26,
      lineHeight: 34,
      fontWeight: fontWeights.semibold,
      letterSpacing: -0.3,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    h3: {
      fontSize: 22,
      lineHeight: 30,
      fontWeight: fontWeights.semibold,
      letterSpacing: -0.2,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    h4: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: fontWeights.semibold,
      letterSpacing: -0.1,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    h5: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    // Body - Main content text
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.15,
      fontFamily: fontFamily!.regular,
    } as TextStyleDefinition,

    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.2,
      fontFamily: fontFamily!.regular,
    } as TextStyleDefinition,

    bodySmall: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.25,
      fontFamily: fontFamily!.regular,
    } as TextStyleDefinition,

    // Labels - Form labels, button text
    labelLarge: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: fontWeights.medium,
      letterSpacing: 0.1,
      fontFamily: fontFamily!.medium,
    } as TextStyleDefinition,

    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: fontWeights.medium,
      letterSpacing: 0.15,
      fontFamily: fontFamily!.medium,
    } as TextStyleDefinition,

    labelSmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: fontWeights.medium,
      letterSpacing: 0.4,
      fontFamily: fontFamily!.medium,
    } as TextStyleDefinition,

    // Caption - Supporting text, metadata
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.3,
      fontFamily: fontFamily!.regular,
    } as TextStyleDefinition,

    captionSmall: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.4,
      fontFamily: fontFamily!.regular,
    } as TextStyleDefinition,

    // Overline - Section headers, category labels
    overline: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: fontWeights.semibold,
      letterSpacing: 1.5,
      fontFamily: fontFamily!.semibold,
      textTransform: 'uppercase' as const,
    } as TextStyleDefinition & { textTransform: 'uppercase' },

    // Button text
    buttonLarge: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0.2,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    button: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0.3,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    buttonSmall: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0.4,
      fontFamily: fontFamily!.semibold,
    } as TextStyleDefinition,

    // Numeric - For ratings, stats, prices
    numeric: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0,
      fontFamily: fontFamily!.semibold,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    } as TextStyleDefinition & { fontVariant: ('tabular-nums')[] },

    numericLarge: {
      fontSize: 24,
      lineHeight: 28,
      fontWeight: fontWeights.bold,
      letterSpacing: -0.2,
      fontFamily: fontFamily!.bold,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    } as TextStyleDefinition & { fontVariant: ('tabular-nums')[] },
  },
} as const;

export type Typography = typeof typography;
export type TextVariant = keyof typeof typography.sizes;
