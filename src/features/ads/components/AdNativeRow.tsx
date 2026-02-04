import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Text, Card } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS } from '../constants';
import { AdPlacement } from '../types';

interface AdNativeRowProps {
  placement: AdPlacement;
}

export function AdNativeRow({ placement }: AdNativeRowProps) {
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
    console.warn(`[AdNativeRow] Failed to load ad for ${placement}:`, error.message);
  }, [placement]);

  if (!shouldShow) {
    return null;
  }

  const unitId = AD_UNIT_IDS[placement];

  return (
    <View style={styles.container}>
      {/* Header matching MediaRow style */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.text.tertiary + '20' },
            ]}
          >
            <Ionicons
              name="megaphone-outline"
              size={14}
              color={theme.colors.text.tertiary}
            />
          </View>
          <Text variant="caption" color="tertiary">
            Sponsored
          </Text>
        </View>
      </View>

      {/* Ad Content */}
      <View style={styles.adWrapper}>
        <Card
          variant="filled"
          padding="sm"
          style={[
            styles.adCard,
            { backgroundColor: theme.colors.background.secondary },
          ]}
        >
          {isLoading && (
            <View style={styles.loadingContainer}>
              <AdPlaceholder size="mediumRectangle" />
            </View>
          )}
          {!hasError && (
            <BannerAd
              unitId={unitId}
              size={BannerAdSize.MEDIUM_RECTANGLE}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={handleAdLoaded}
              onAdFailedToLoad={handleAdFailed}
            />
          )}
          {hasError && !isLoading && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={theme.colors.text.tertiary}
              />
              <Text variant="caption" color="tertiary" style={styles.errorText}>
                Ad content unavailable
              </Text>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adWrapper: {
    paddingHorizontal: 20,
  },
  adCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
    overflow: 'hidden',
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorText: {
    marginTop: 4,
  },
});
