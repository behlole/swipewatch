import { useEffect, useRef, useState, useCallback } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS } from '../constants';
import { AdPlacement } from '../types';

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
  const adRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    // Don't load ads for premium users
    if (isPremium || !adsEnabled) {
      setIsLoading(false);
      return;
    }

    const unitId = AD_UNIT_IDS[placement];
    const interstitial = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsReady(true);
        setIsLoading(false);
      }
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsReady(false);
        resetSwipeCount();
        onClose?.();
        // Preload next ad
        interstitial.load();
        setIsLoading(true);
      }
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        setIsReady(false);
        setIsLoading(false);
        console.warn('[useInterstitialAd] Error:', error);
        onError?.(new Error(String(error)));
      }
    );

    // Start loading
    interstitial.load();
    adRef.current = interstitial;

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isPremium, adsEnabled, placement, onClose, onError, resetSwipeCount]);

  const showAd = useCallback((): boolean => {
    if (!isReady || !adRef.current || isPremium || !adsEnabled) {
      return false;
    }

    if (!canShowAd(placement)) {
      return false;
    }

    try {
      recordImpression(placement);
      adRef.current.show();
      return true;
    } catch (error) {
      console.warn('[useInterstitialAd] Failed to show ad:', error);
      return false;
    }
  }, [isReady, isPremium, adsEnabled, canShowAd, recordImpression, placement]);

  return {
    showAd,
    isReady: isReady && !isPremium && adsEnabled,
    isLoading,
  };
}
