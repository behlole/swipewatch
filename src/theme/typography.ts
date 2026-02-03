import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  fontFamily: {
    regular: fontFamily,
    medium: fontFamily,
    semibold: fontFamily,
    bold: fontFamily,
  },

  sizes: {
    // Display
    display1: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: '700' as const,
    },
    display2: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700' as const,
    },

    // Headings
    h1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    h4: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600' as const,
    },

    // Body
    bodyLarge: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
    },

    // Labels
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500' as const,
    },

    // Caption
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    captionSmall: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '400' as const,
    },
  },
} as const;

export type Typography = typeof typography;
