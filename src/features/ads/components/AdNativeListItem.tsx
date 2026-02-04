import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Text } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS } from '../constants';
import { AdPlacement } from '../types';

interface AdNativeListItemProps {
  placement: AdPlacement;
}

export function AdNativeListItem({ placement }: AdNativeListItemProps) {
  const theme = useTheme();
  const { isPremium, recordImpression } = useAdStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  console.log(`[AdNativeListItem] Rendering for ${placement}, isPremium: ${isPremium}`);

  const handleAdLoaded = useCallback(() => {
    console.log(`[AdNativeListItem] Ad loaded successfully for ${placement}`);
    setIsLoading(false);
    setHasError(false);
    recordImpression(placement);
  }, [placement, recordImpression]);

  const handleAdFailed = useCallback((error: Error) => {
    console.log(`[AdNativeListItem] Ad failed for ${placement}:`, error.message);
    setIsLoading(false);
    setHasError(true);
  }, [placement]);

  if (isPremium) {
    return null;
  }

  const unitId = AD_UNIT_IDS[placement];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.secondary },
      ]}
    >
      {/* Sponsored label */}
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

      {/* Ad Content */}
      <View style={styles.adContent}>
        {isLoading && (
          <AdPlaceholder size="largeBanner" />
        )}
        {!hasError && (
          <BannerAd
            unitId={unitId}
            size={BannerAdSize.LARGE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={handleAdLoaded}
            onAdFailedToLoad={handleAdFailed}
          />
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
  errorContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
