export const colors = {
  // Primary Brand
  primary: {
    50: '#FEE7E8',
    100: '#FDBFC2',
    200: '#FB9599',
    300: '#F96A70',
    400: '#F74551',
    500: '#E50914', // Main Netflix-inspired red
    600: '#B20710',
    700: '#8A050C',
    800: '#620408',
    900: '#3A0205',
  },

  // Accent Colors
  accent: {
    like: '#00D26A',
    likeBg: 'rgba(0, 210, 106, 0.15)',
    nope: '#FF4458',
    nopeBg: 'rgba(255, 68, 88, 0.15)',
    superLike: '#FFD700',
    yellow: '#FFD700',
    watchlist: '#5B5FED',
    // AI-powered feature colors
    ai: '#8B5CF6', // Purple for AI features
    aiBg: 'rgba(139, 92, 246, 0.15)',
    aiGradientStart: '#8B5CF6',
    aiGradientEnd: '#EC4899',
    spark: '#F59E0B', // Amber for sparkles/recommendations
    sparkBg: 'rgba(245, 158, 11, 0.15)',
  },

  // Semantic
  success: '#00D26A',
  warning: '#FFAA00',
  error: '#FF4458',
  info: '#5B5FED',

  // Rating Colors
  rating: {
    excellent: '#21D07A', // 8.0+
    good: '#D2D531', // 6.0-7.9
    average: '#D89C25', // 4.0-5.9
    poor: '#DB2360', // Below 4.0
  },

  // Dark Theme
  dark: {
    background: {
      primary: '#0D0D0D',
      secondary: '#1A1A1A',
      tertiary: '#2D2D2D',
      elevated: '#3D3D3D',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
      tertiary: '#6B6B6B',
      inverse: '#0D0D0D',
    },
    border: {
      subtle: '#2D2D2D',
      default: '#3D3D3D',
      strong: '#4D4D4D',
    },
  },

  // Light Theme
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      tertiary: '#EBEBEB',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
      tertiary: '#A3A3A3',
      inverse: '#FFFFFF',
    },
    border: {
      subtle: '#EBEBEB',
      default: '#D4D4D4',
      strong: '#A3A3A3',
    },
  },
} as const;

export type Colors = typeof colors;
