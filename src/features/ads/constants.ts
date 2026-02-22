import { nativeAdsModule } from './nativeAdsGate';
import { AdPlacement, FrequencyCapConfig } from './types';

// Fallback test IDs when native module not available (Expo Go) or for test ads
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TestIds = nativeAdsModule?.TestIds ?? { BANNER: TEST_BANNER, INTERSTITIAL: TEST_INTERSTITIAL };

// Use test ads when: env says true, OR we're in __DEV__ (so dev builds always get a fill; production units often show "0 active" until app has traffic)
const USE_TEST_ADS =
  process.env.EXPO_PUBLIC_USE_TEST_ADS !== 'false' || (typeof __DEV__ !== 'undefined' && __DEV__);

// Production AdMob unit IDs (only used when USE_TEST_ADS is false, e.g. release build with EXPO_PUBLIC_USE_TEST_ADS=false)
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
