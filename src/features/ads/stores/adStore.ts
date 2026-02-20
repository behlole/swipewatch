import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdPlacement, FrequencyCapConfig } from '../types';
import { DEFAULT_FREQUENCY_CONFIG } from '../constants';

interface AdStoreState {
  // Premium state
  isPremium: boolean;
  adsEnabled: boolean;

  // Frequency tracking
  swipesSinceLastAd: number;
  sessionImpressions: number;
  impressionCounts: Record<AdPlacement, number>;
  lastShownTimes: Record<AdPlacement, number>;

  // Config
  frequencyConfig: FrequencyCapConfig;

  // Actions
  setAdsEnabled: (enabled: boolean) => void;
  setPremium: (isPremium: boolean) => void;
  recordImpression: (placement: AdPlacement) => void;
  recordSwipe: () => void;
  resetSwipeCount: () => void;
  resetSessionImpressions: () => void;
  canShowAd: (placement: AdPlacement) => boolean;
  getTimeSinceLastAd: (placement: AdPlacement) => number;
  shouldShowInterstitial: () => boolean;
}

const initialImpressionCounts: Record<AdPlacement, number> = {
  home_between_rows: 0,
  swipe_interstitial: 0,
  watchlist_inline: 0,
  profile_section: 0,
  media_detail: 0,
  analytics_section: 0,
};

const initialLastShownTimes: Record<AdPlacement, number> = {
  home_between_rows: 0,
  swipe_interstitial: 0,
  watchlist_inline: 0,
  profile_section: 0,
  media_detail: 0,
  analytics_section: 0,
};

export const useAdStore = create<AdStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPremium: false,
      adsEnabled: true,
      swipesSinceLastAd: 0,
      sessionImpressions: 0,
      impressionCounts: { ...initialImpressionCounts },
      lastShownTimes: { ...initialLastShownTimes },
      frequencyConfig: DEFAULT_FREQUENCY_CONFIG,

      // Actions
      setAdsEnabled: (enabled) => set({ adsEnabled: enabled }),

      setPremium: (isPremium) => set({ isPremium, adsEnabled: !isPremium }),

      recordImpression: (placement) =>
        set((state) => ({
          lastShownTimes: {
            ...state.lastShownTimes,
            [placement]: Date.now(),
          },
          impressionCounts: {
            ...state.impressionCounts,
            [placement]: (state.impressionCounts[placement] || 0) + 1,
          },
          sessionImpressions: state.sessionImpressions + 1,
        })),

      recordSwipe: () =>
        set((state) => ({
          swipesSinceLastAd: state.swipesSinceLastAd + 1,
        })),

      resetSwipeCount: () => set({ swipesSinceLastAd: 0 }),

      resetSessionImpressions: () =>
        set({
          sessionImpressions: 0,
          impressionCounts: { ...initialImpressionCounts },
        }),

      canShowAd: (placement) => {
        const state = get();
        const {
          frequencyConfig,
          isPremium,
          adsEnabled,
          sessionImpressions,
          impressionCounts,
          lastShownTimes,
        } = state;

        // Premium users don't see ads
        if (isPremium || !adsEnabled) return false;

        // Check session limit
        if (sessionImpressions >= frequencyConfig.maxImpressionsPerSession) return false;

        // Check per-placement limit
        const placementImpressions = impressionCounts[placement] || 0;
        if (placementImpressions >= frequencyConfig.maxImpressionsPerPlacement) return false;

        // Check time since last ad at this placement
        const lastShown = lastShownTimes[placement] || 0;
        const timeSinceLastAd = Date.now() - lastShown;
        if (lastShown > 0 && timeSinceLastAd < frequencyConfig.minTimeBetweenAds) return false;

        return true;
      },

      getTimeSinceLastAd: (placement) => {
        const lastShown = get().lastShownTimes[placement] || 0;
        return Date.now() - lastShown;
      },

      shouldShowInterstitial: () => {
        const state = get();
        const { swipesSinceLastAd, frequencyConfig, isPremium, adsEnabled } = state;

        if (isPremium || !adsEnabled) return false;

        return swipesSinceLastAd >= frequencyConfig.swipesBetweenInterstitials;
      },
    }),
    {
      name: 'swipewatch-ad-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isPremium: state.isPremium,
        adsEnabled: state.adsEnabled,
        frequencyConfig: state.frequencyConfig,
      }),
      // Merge persisted config with defaults so swipesBetweenInterstitials stays 7
      merge: (persisted, current) => {
        const p = persisted as Partial<AdStoreState> | undefined;
        if (!p) return current;
        return {
          ...current,
          isPremium: p.isPremium ?? current.isPremium,
          adsEnabled: p.adsEnabled ?? current.adsEnabled,
          frequencyConfig: {
            ...DEFAULT_FREQUENCY_CONFIG,
            ...p.frequencyConfig,
            swipesBetweenInterstitials: DEFAULT_FREQUENCY_CONFIG.swipesBetweenInterstitials,
          },
        };
      },
    }
  )
);
