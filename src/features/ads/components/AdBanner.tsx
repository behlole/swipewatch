import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ViewProps, Dimensions } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS, BANNER_HEIGHTS } from '../constants';
import { AdPlacement, BannerSize } from '../types';
import { isNativeAdsAvailable, nativeAdsModule } from '../nativeAdsGate';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const { isPremium, adsEnabled, recordImpression } = useAdStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleAdLoaded = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    recordImpression(placement);
  }, [placement, recordImpression]);

  const handleAdFailed = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (isPremium || !adsEnabled) return null;

  const minHeight = BANNER_HEIGHTS[size];

  // Expo Go / web: native module not available — show placeholder so layout is reserved
  if (!isNativeAdsAvailable || !nativeAdsModule) {
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
          <AdPlaceholder size={size} />
        </View>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = nativeAdsModule;
  const unitId = AD_UNIT_IDS[placement];
  // Use adaptive banner so the ad gets proper dimensions from screen width (fixes 0x0 view on Android)
  const useAdaptive = size === 'banner' || size === 'largeBanner';
  const bannerSize = useAdaptive
    ? BannerAdSize.ANCHORED_ADAPTIVE_BANNER
    : BannerAdSize.MEDIUM_RECTANGLE;

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
          <View style={[styles.bannerWrapper, { minHeight }]}>
            <BannerAd
              unitId={unitId}
              size={bannerSize}
              width={Math.floor(SCREEN_WIDTH)}
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
