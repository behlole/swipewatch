import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Text } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS } from '../constants';
import { AdPlacement } from '../types';
import { isNativeAdsAvailable, nativeAdsModule } from '../nativeAdsGate';

interface AdNativeListItemProps {
  placement: AdPlacement;
}

export function AdNativeListItem({ placement }: AdNativeListItemProps) {
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

  if (!isNativeAdsAvailable || !nativeAdsModule) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.secondary },
        ]}
      >
        <View style={styles.labelRow}>
          <Ionicons
            name="megaphone-outline"
            size={12}
            color={theme.colors.text.tertiary}
          />
          <Text variant="captionSmall" color="tertiary">
            Sponsored
          </Text>
        </View>
        <View style={styles.adContent}>
          <AdPlaceholder size="largeBanner" />
        </View>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = nativeAdsModule;
  const unitId = AD_UNIT_IDS[placement];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.secondary },
      ]}
    >
      <View style={styles.labelRow}>
        <Ionicons
          name="megaphone-outline"
          size={12}
          color={theme.colors.text.tertiary}
        />
        <Text variant="captionSmall" color="tertiary">
          Sponsored
        </Text>
      </View>

      <View style={styles.adContent}>
        {isLoading && <AdPlaceholder size="largeBanner" />}
        {!hasError && (
          <View style={styles.bannerWrapper}>
            <BannerAd
              unitId={unitId}
              size={BannerAdSize.LARGE_BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={handleAdLoaded}
              onAdFailedToLoad={handleAdFailed}
            />
          </View>
        )}
        {hasError && !isLoading && (
          <View style={styles.errorContainer}>
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
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    opacity: 0.7,
  },
  adContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  bannerWrapper: {
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
