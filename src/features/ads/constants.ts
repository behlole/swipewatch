import { TestIds } from 'react-native-google-mobile-ads';
import { AdPlacement, FrequencyCapConfig } from './types';

// Use test IDs in development, production IDs from env vars in production
export const AD_UNIT_IDS: Record<AdPlacement, string> = __DEV__
  ? {
      home_between_rows: TestIds.NATIVE,
      swipe_interstitial: TestIds.INTERSTITIAL,
      watchlist_inline: TestIds.NATIVE,
      profile_section: TestIds.BANNER,
      media_detail: TestIds.BANNER,
      analytics_section: TestIds.BANNER,
    }
  : {
      home_between_rows: process.env.EXPO_PUBLIC_ADMOB_NATIVE_HOME || TestIds.NATIVE,
      swipe_interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_SWIPE || TestIds.INTERSTITIAL,
      watchlist_inline: process.env.EXPO_PUBLIC_ADMOB_NATIVE_WATCHLIST || TestIds.NATIVE,
      profile_section: process.env.EXPO_PUBLIC_ADMOB_BANNER_PROFILE || TestIds.BANNER,
      media_detail: process.env.EXPO_PUBLIC_ADMOB_BANNER_DETAIL || TestIds.BANNER,
      analytics_section: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANALYTICS || TestIds.BANNER,
    };

export const DEFAULT_FREQUENCY_CONFIG: FrequencyCapConfig = {
  maxImpressionsPerSession: 15,
  maxImpressionsPerPlacement: 5,
  minTimeBetweenAds: 60000, // 1 minute
  swipesBetweenInterstitials: 8,
};

export const BANNER_HEIGHTS = {
  banner: 50,
  largeBanner: 100,
  mediumRectangle: 250,
} as const;
