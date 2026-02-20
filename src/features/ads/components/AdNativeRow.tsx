import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Text, Card } from '../../../components/ui';
import { AdPlaceholder } from './AdPlaceholder';
import { useAdStore } from '../stores/adStore';
import { AD_UNIT_IDS } from '../constants';
import { AdPlacement } from '../types';
import { isNativeAdsAvailable, nativeAdsModule } from '../nativeAdsGate';

interface AdNativeRowProps {
  placement: AdPlacement;
}

export function AdNativeRow({ placement }: AdNativeRowProps) {
  const theme = useTheme();
  const { isPremium, adsEnabled, recordImpression } = useAdStore();
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

  if (isPremium || !adsEnabled) return null;

  // Expo Go / web: show placeholder so layout is reserved
  if (!isNativeAdsAvailable || !nativeAdsModule) {
    return (
      <View style={styles.container}>
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
        <View style={styles.adWrapper}>
          <Card
            variant="filled"
            padding="sm"
            style={[
              styles.adCard,
              { backgroundColor: theme.colors.background.secondary },
            ]}
          >
            <View style={styles.loadingContainer}>
              <AdPlaceholder size="mediumRectangle" />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = nativeAdsModule;
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
            <View style={styles.bannerAdWrapper}>
              <BannerAd
                unitId={unitId}
                size={BannerAdSize.MEDIUM_RECTANGLE}
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
  bannerAdWrapper: {
    width: '100%',
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
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
