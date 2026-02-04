import { useMemo, useCallback } from 'react';
import { useAdStore } from '../stores/adStore';
import { AdPlacement } from '../types';

interface UseAdFrequencyReturn {
  canShowAd: boolean;
  recordImpression: () => void;
  timeSinceLastAd: number;
  timeUntilNextAd: number;
  impressionCount: number;
  sessionImpressions: number;
}

export function useAdFrequency(placement: AdPlacement): UseAdFrequencyReturn {
  const {
    canShowAd: storeCanShowAd,
    recordImpression: storeRecordImpression,
    getTimeSinceLastAd,
    frequencyConfig,
    impressionCounts,
    sessionImpressions,
  } = useAdStore();

  const canShowAd = useMemo(
    () => storeCanShowAd(placement),
    [storeCanShowAd, placement]
  );

  const recordImpression = useCallback(() => {
    storeRecordImpression(placement);
  }, [storeRecordImpression, placement]);

  const timeSinceLastAd = useMemo(
    () => getTimeSinceLastAd(placement),
    [getTimeSinceLastAd, placement]
  );

  const timeUntilNextAd = useMemo(() => {
    const elapsed = timeSinceLastAd;
    const remaining = frequencyConfig.minTimeBetweenAds - elapsed;
    return Math.max(0, remaining);
  }, [timeSinceLastAd, frequencyConfig.minTimeBetweenAds]);

  const impressionCount = impressionCounts[placement] || 0;

  return {
    canShowAd,
    recordImpression,
    timeSinceLastAd,
    timeUntilNextAd,
    impressionCount,
    sessionImpressions,
  };
}
