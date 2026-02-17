import { nativeAdsModule } from './nativeAdsGate';
import { AdPlacement, FrequencyCapConfig } from './types';

// Fallback test IDs when native module not available (Expo Go) or for test ads
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TestIds = nativeAdsModule?.TestIds ?? { BANNER: TEST_BANNER, INTERSTITIAL: TEST_INTERSTITIAL };

// Set EXPO_PUBLIC_USE_TEST_ADS=true in .env to use test ads
// Set EXPO_PUBLIC_USE_TEST_ADS=false to use real production ads
const USE_TEST_ADS = process.env.EXPO_PUBLIC_USE_TEST_ADS !== 'false';

export const AD_UNIT_IDS: Record<AdPlacement, string> = USE_TEST_ADS
  ? {
      home_between_rows: TestIds.BANNER,
      swipe_interstitial: TestIds.INTERSTITIAL,
      watchlist_inline: TestIds.BANNER,
      profile_section: TestIds.BANNER,
      media_detail: TestIds.BANNER,
      analytics_section: TestIds.BANNER,
    }
  : {
      home_between_rows: process.env.EXPO_PUBLIC_ADMOB_NATIVE_HOME || TestIds.BANNER,
      swipe_interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_SWIPE || TestIds.INTERSTITIAL,
      watchlist_inline: process.env.EXPO_PUBLIC_ADMOB_NATIVE_WATCHLIST || TestIds.BANNER,
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
