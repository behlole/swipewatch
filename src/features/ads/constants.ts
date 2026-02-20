import { nativeAdsModule } from './nativeAdsGate';
import { AdPlacement, FrequencyCapConfig } from './types';

// Fallback test IDs when native module not available (Expo Go) or for test ads
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TestIds = nativeAdsModule?.TestIds ?? { BANNER: TEST_BANNER, INTERSTITIAL: TEST_INTERSTITIAL };

// Set EXPO_PUBLIC_USE_TEST_ADS=true in .env to use test ads (default in dev)
// Set EXPO_PUBLIC_USE_TEST_ADS=false for production ads
const USE_TEST_ADS = process.env.EXPO_PUBLIC_USE_TEST_ADS !== 'false';

// Production AdMob unit IDs: use .env when set, else fallback (see .env for keys)
const PRODUCTION_AD_UNIT_IDS: Record<AdPlacement, string> = {
  home_between_rows: process.env.EXPO_PUBLIC_ADMOB_BANNER_DETAIL ?? 'ca-app-pub-8017092196734683/4612687793',
  swipe_interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_SWIPE ?? 'ca-app-pub-8017092196734683/2186234387',
  watchlist_inline: process.env.EXPO_PUBLIC_ADMOB_NATIVE_WATCHLIST ?? 'ca-app-pub-8017092196734683/3969797760',
  profile_section: process.env.EXPO_PUBLIC_ADMOB_BANNER_PROFILE ?? 'ca-app-pub-8017092196734683/2193973241',
  media_detail: process.env.EXPO_PUBLIC_ADMOB_BANNER_DETAIL ?? 'ca-app-pub-8017092196734683/4612687793',
  analytics_section: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANALYTICS ?? 'ca-app-pub-8017092196734683/8567809901',
};

export const AD_UNIT_IDS: Record<AdPlacement, string> = USE_TEST_ADS
  ? {
      home_between_rows: TestIds.BANNER,
      swipe_interstitial: TestIds.INTERSTITIAL,
      watchlist_inline: TestIds.BANNER,
      profile_section: TestIds.BANNER,
      media_detail: TestIds.BANNER,
      analytics_section: TestIds.BANNER,
    }
  : PRODUCTION_AD_UNIT_IDS;

export const DEFAULT_FREQUENCY_CONFIG: FrequencyCapConfig = {
  maxImpressionsPerSession: 15,
  maxImpressionsPerPlacement: 5,
  minTimeBetweenAds: 60000, // 1 minute
  swipesBetweenInterstitials: 7,
};

export const BANNER_HEIGHTS = {
  banner: 50,
  largeBanner: 100,
  mediumRectangle: 250,
} as const;
