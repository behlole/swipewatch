import { useEffect, useRef, useState, useCallback } from 'react';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS } from '../constants';
import { AdPlacement } from '../types';
import { isNativeAdsAvailable, nativeAdsModule } from '../nativeAdsGate';

const SWIPE_INTERSTITIAL_PLACEMENT: AdPlacement = 'swipe_interstitial';

interface UseInterstitialAdOptions {
  placement: AdPlacement;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

interface UseInterstitialAdReturn {
  showAd: () => boolean;
  isReady: boolean;
  isLoading: boolean;
}

export function useInterstitialAd({
  placement,
  onClose,
  onError,
}: UseInterstitialAdOptions): UseInterstitialAdReturn {
  const { isPremium, adsEnabled, canShowAd, recordImpression, resetSwipeCount } =
    useAdStore();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const adRef = useRef<{ show: () => void } | null>(null);
  const pendingShowRef = useRef(false);

  useEffect(() => {
    if (!isNativeAdsAvailable || !nativeAdsModule) {
      if (__DEV__) console.log('[Ad] Interstitial: native not available, skipping load');
      setIsLoading(false);
      return;
    }
    if (isPremium || !adsEnabled) {
      if (__DEV__) console.log('[Ad] Interstitial: premium or ads disabled, skipping load');
      setIsLoading(false);
      return;
    }

    const { InterstitialAd, AdEventType } = nativeAdsModule;
    const unitId = AD_UNIT_IDS[placement];
    if (__DEV__) console.log('[Ad] Interstitial: loading unitId', unitId?.slice(0, 20) + '...');
    const interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsReady(true);
        setIsLoading(false);
        if (__DEV__) console.log('[Ad] Interstitial: LOADED, pendingShow=', pendingShowRef.current);
        if (placement === SWIPE_INTERSTITIAL_PLACEMENT) {
          const state = useAdStore.getState();
          const shouldShow =
            pendingShowRef.current ||
            (state.shouldShowInterstitial() && state.canShowAd(placement));
          if (__DEV__) console.log('[Ad] Interstitial: shouldShow=', shouldShow, 'swipes=', state.swipesSinceLastAd);
          if (shouldShow) {
            pendingShowRef.current = false;
            try {
              useAdStore.getState().recordImpression(placement);
              interstitial.show();
              setIsReady(false);
              if (__DEV__) console.log('[Ad] Interstitial: showed from LOADED');
            } catch (err) {
              if (__DEV__) console.warn('[Ad] Interstitial: show() failed', err);
            }
          }
        }
      }
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        pendingShowRef.current = false;
        setIsReady(false);
        resetSwipeCount();
        onClose?.();
        interstitial.load();
        setIsLoading(true);
      }
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        if (__DEV__) console.warn('[Ad] Interstitial: ERROR', error);
        pendingShowRef.current = false;
        setIsReady(false);
        setIsLoading(false);
        onError?.(new Error(String(error)));
      }
    );

    interstitial.load();
    adRef.current = interstitial;

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isPremium, adsEnabled, placement, onClose, onError, resetSwipeCount]);

  const showAd = useCallback((): boolean => {
    if (!isNativeAdsAvailable || !nativeAdsModule) {
      if (__DEV__) console.log('[Ad] showAd: native not available');
      return false;
    }
    if (isPremium || !adsEnabled) {
      if (__DEV__) console.log('[Ad] showAd: premium or ads disabled');
      return false;
    }
    if (!canShowAd(placement)) {
      if (__DEV__) {
        const s = useAdStore.getState();
        console.log('[Ad] showAd: canShowAd=false', {
          sessionImpressions: s.sessionImpressions,
          placementImpressions: s.impressionCounts[placement],
          lastShown: s.lastShownTimes[placement],
          minTimeBetween: s.frequencyConfig.minTimeBetweenAds,
        });
      }
      return false;
    }
    if (isReady && adRef.current) {
      try {
        recordImpression(placement);
        adRef.current.show();
        if (__DEV__) console.log('[Ad] showAd: showed');
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Ad] showAd: show() threw', err);
        return false;
      }
    }
    if (placement === SWIPE_INTERSTITIAL_PLACEMENT && useAdStore.getState().shouldShowInterstitial()) {
      pendingShowRef.current = true;
      if (__DEV__) console.log('[Ad] showAd: ad not ready, set pendingShow (will show when LOADED)');
    }
    return false;
  }, [isReady, isPremium, adsEnabled, canShowAd, recordImpression, placement]);

  if (!isNativeAdsAvailable) {
    return { showAd: () => false, isReady: false, isLoading: false };
  }

  return {
    showAd,
    isReady: isReady && !isPremium && adsEnabled,
    isLoading,
  };
}
