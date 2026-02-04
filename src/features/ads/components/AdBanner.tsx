import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '../../../theme';
import { Text } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS, BANNER_HEIGHTS } from '../constants';
import { AdPlacement, BannerSize } from '../types';

interface AdBannerProps extends ViewProps {
  placement: AdPlacement;
  size?: BannerSize;
  showLabel?: boolean;
}

const BANNER_SIZE_MAP: Record<BannerSize, BannerAdSize> = {
  banner: BannerAdSize.BANNER,
  largeBanner: BannerAdSize.LARGE_BANNER,
  mediumRectangle: BannerAdSize.MEDIUM_RECTANGLE,
};

export function AdBanner({
  placement,
  size = 'banner',
  showLabel = true,
  style,
  ...props
}: AdBannerProps) {
  const theme = useTheme();
  const { isPremium, adsEnabled, canShowAd, recordImpression } = useAdStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const shouldShow = !isPremium && adsEnabled && canShowAd(placement);

  const handleAdLoaded = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    recordImpression(placement);
  }, [placement, recordImpression]);

  const handleAdFailed = useCallback((error: Error) => {
    setIsLoading(false);
    setHasError(true);
    console.warn(`[AdBanner] Failed to load ad for ${placement}:`, error.message);
  }, [placement]);

  // Don't render if premium, ads disabled, or frequency cap reached
  if (!shouldShow) {
    return null;
  }

  const unitId = AD_UNIT_IDS[placement];
  const bannerSize = BANNER_SIZE_MAP[size];
  const minHeight = BANNER_HEIGHTS[size];

  return (
    <View style={[styles.container, style]} {...props}>
      {showLabel && (
        <Text variant="captionSmall" color="tertiary" style={styles.label}>
          Advertisement
        </Text>
      )}
      <View
        style={[
          styles.adContainer,
          {
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.md,
            minHeight: minHeight + 8,
          },
        ]}
      >
        {isLoading && <AdPlaceholder size={size} />}
        {!hasError && (
          <BannerAd
            unitId={unitId}
            size={bannerSize}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={handleAdLoaded}
            onAdFailedToLoad={handleAdFailed}
          />
        )}
        {hasError && !isLoading && (
          <View style={[styles.errorContainer, { height: minHeight }]}>
            <Text variant="caption" color="tertiary">
              Ad unavailable
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  label: {
    marginBottom: 4,
    opacity: 0.6,
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
