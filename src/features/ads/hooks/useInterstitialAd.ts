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
      setIsLoading(false);
      return;
    }
    if (isPremium || !adsEnabled) {
      setIsLoading(false);
      return;
    }

    const { InterstitialAd, AdEventType } = nativeAdsModule;
    const unitId = AD_UNIT_IDS[placement];
    const interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsReady(true);
        setIsLoading(false);
        // Swipe interstitial: show now if user already hit 7 swipes or requested show while loading
        if (placement === SWIPE_INTERSTITIAL_PLACEMENT) {
          const state = useAdStore.getState();
          const shouldShow =
            pendingShowRef.current ||
            (state.shouldShowInterstitial() && state.canShowAd(placement));
          if (shouldShow) {
            pendingShowRef.current = false;
            try {
              useAdStore.getState().recordImpression(placement);
              interstitial.show();
              setIsReady(false);
            } catch {
              // ignore
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
    if (!isNativeAdsAvailable || !nativeAdsModule) return false;
    if (isPremium || !adsEnabled) return false;
    if (!canShowAd(placement)) return false;
    if (isReady && adRef.current) {
      try {
        recordImpression(placement);
        adRef.current.show();
        return true;
      } catch {
        return false;
      }
    }
    // Ad not ready yet (e.g. still loading): show when LOADED fires
    if (placement === SWIPE_INTERSTITIAL_PLACEMENT && useAdStore.getState().shouldShowInterstitial()) {
      pendingShowRef.current = true;
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
