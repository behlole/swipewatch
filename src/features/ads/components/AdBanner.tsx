import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS, BANNER_HEIGHTS } from '../constants';
import { AdPlacement, BannerSize } from '../types';
import { isNativeAdsAvailable, nativeAdsModule } from '../nativeAdsGate';

interface AdBannerProps extends ViewProps {
  placement: AdPlacement;
  size?: BannerSize;
  showLabel?: boolean;
}

export function AdBanner({
  placement,
  size = 'banner',
  showLabel = true,
  style,
  ...props
}: AdBannerProps) {
  const theme = useTheme();
  const { isPremium, recordImpression } = useAdStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleAdLoaded = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    recordImpression(placement);
  }, [placement, recordImpression]);

  const handleAdFailed = useCallback((error: Error) => {
    setIsLoading(false);
    setHasError(true);
  }, [placement]);

  if (!isNativeAdsAvailable || !nativeAdsModule) return null;
  if (isPremium) return null;

  const { BannerAd, BannerAdSize } = nativeAdsModule;
  const bannerSizeMap: Record<BannerSize, ReturnType<typeof BannerAdSize.BANNER>> = {
    banner: BannerAdSize.BANNER,
    largeBanner: BannerAdSize.LARGE_BANNER,
    mediumRectangle: BannerAdSize.MEDIUM_RECTANGLE,
  };
  const unitId = AD_UNIT_IDS[placement];
  const bannerSize = bannerSizeMap[size];
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
            width: '100%',
          },
        ]}
      >
        {isLoading && <AdPlaceholder size={size} />}
        {!hasError && (
          <View style={styles.bannerWrapper}>
            <BannerAd
              unitId={unitId}
              size={bannerSize}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={handleAdLoaded}
              onAdFailedToLoad={handleAdFailed}
            />
          </View>
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
  bannerWrapper: {
    width: '100%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
