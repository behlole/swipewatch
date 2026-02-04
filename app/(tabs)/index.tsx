import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Skeleton } from '../../src/components/ui';
import { MediaRow, BackdropCard, PosterCard } from '../../src/components/media';
import { ForYouSection } from '../../src/components/recommendations';
import { AdNativeRow } from '../../src/features/ads';
import { useDiscovery, useSearch } from '../../src/hooks/useDiscovery';
import { useAuthStore } from '../../src/features/auth/stores/authStore';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { Media } from '../../src/types';
import { Recommendation } from '../../src/types/recommendations';

export default function DiscoverScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const {
    trending,
    popular,
    topRated,
    upcoming,
    nowPlaying,
    isLoading,
    refresh,
    loadMorePopular,
    loadMoreTopRated,
    loadMoreUpcoming,
    loadMoreNowPlaying,
    isLoadingMorePopular,
    isLoadingMoreTopRated,
    isLoadingMoreUpcoming,
    isLoadingMoreNowPlaying,
    hasMorePopular,
    hasMoreTopRated,
    hasMoreUpcoming,
    hasMoreNowPlaying,
  } = useDiscovery();
  const { results: searchResults, isLoading: searchLoading, isLoadingMore: searchLoadingMore, loadMore: searchLoadMore, hasMore: searchHasMore } = useSearch(searchQuery);
  const [refreshing, setRefreshing] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMediaPress = useCallback((media: Media) => {
    router.push(`/media/${media.type}/${media.id}`);
  }, []);

  const handleRecommendationPress = (recommendation: Recommendation) => {
    router.push({
      pathname: `/media/${recommendation.contentType}/${recommendation.contentId}`,
      params: { explanation: recommendation.explanation.text },
    });
  };

  const handleImproveRecommendations = () => {
    router.push('/(onboarding)/taste');
  };

  const renderSearchItem = useCallback(({ item }: { item: Media }) => (
    <View style={styles.searchGridItem}>
      <PosterCard
        media={item}
        size="md"
        onPress={() => handleMediaPress(item)}
        showYear
      />
    </View>
  ), [handleMediaPress]);

  const renderSearchFooter = useCallback(() => {
    if (!searchLoadingMore) return null;
    return (
      <View style={styles.searchLoadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
      </View>
    );
  }, [searchLoadingMore, theme.colors.primary]);

  const renderSearchResults = () => (
    <View style={styles.searchResults}>
      {searchLoading ? (
        <View style={styles.searchLoading}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="48%" height={180} borderRadius={12} />
          ))}
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.searchRow}
          contentContainerStyle={styles.searchListContent}
          onEndReached={searchHasMore ? searchLoadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderSearchFooter}
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery.length >= 2 ? (
        <View style={styles.emptySearch}>
          <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
          <Text variant="body" color="secondary" align="center">
            No results found for "{searchQuery}"
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="h1" style={styles.headerTitle}>Discover</Text>
          <Text variant="caption" color="tertiary">Find your next favorite</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: isSearching ? theme.colors.primary[500] : theme.colors.border.subtle,
            },
          ]}
        >
          <View style={[styles.searchIconContainer, { backgroundColor: theme.colors.background.tertiary }]}>
            <Ionicons name="search" size={16} color={theme.colors.text.secondary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search movies & TV shows..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearching(true)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.6 }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.text.tertiary} />
            </Pressable>
          )}
        </View>
        {isSearching && (
          <Pressable
            onPress={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }]}
          >
            <Text variant="body" style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
              Cancel
            </Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isSearching ? (
        renderSearchResults()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary[500]}
            />
          }
        >
          {/* Personalized "For You" Section - Only for authenticated users */}
          {isAuthenticated && (
            <ForYouSection
              onItemPress={handleRecommendationPress}
              onImprovePress={handleImproveRecommendations}
            />
          )}

          {/* Featured/Trending Hero */}
          {trending.length > 0 && (
            <View style={styles.heroSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.accent.nope + '20' }]}>
                  <Ionicons name="flame" size={16} color={theme.colors.accent.nope} />
                </View>
                <Text variant="h3" style={styles.sectionTitle}>Trending This Week</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                decelerationRate="fast"
                snapToInterval={spacing.screenPadding * 2 + 20}
                contentContainerStyle={styles.heroScroll}
              >
                {trending.slice(0, 5).map((item, index) => (
                  <BackdropCard
                    key={`${item.type}-${item.id}`}
                    media={item}
                    rank={index + 1}
                    onPress={() => handleMediaPress(item)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Now Playing */}
          <MediaRow
            title="Now Playing"
            items={nowPlaying}
            onItemPress={handleMediaPress}
            isLoading={isLoading}
            onEndReached={loadMoreNowPlaying}
            isLoadingMore={isLoadingMoreNowPlaying}
            hasMore={hasMoreNowPlaying}
          />

          {/* Popular */}
          <MediaRow
            title="Popular Movies"
            items={popular}
            onItemPress={handleMediaPress}
            isLoading={isLoading}
            onEndReached={loadMorePopular}
            isLoadingMore={isLoadingMorePopular}
            hasMore={hasMorePopular}
          />

          {/* Sponsored Ad */}
          <AdNativeRow placement="home_between_rows" />

          {/* Top Rated */}
          <MediaRow
            title="Top Rated"
            items={topRated}
            onItemPress={handleMediaPress}
            isLoading={isLoading}
            onEndReached={loadMoreTopRated}
            isLoadingMore={isLoadingMoreTopRated}
            hasMore={hasMoreTopRated}
          />

          {/* Coming Soon */}
          <MediaRow
            title="Coming Soon"
            items={upcoming}
            onItemPress={handleMediaPress}
            isLoading={isLoading}
            showRating={false}
            onEndReached={loadMoreUpcoming}
            isLoadingMore={isLoadingMoreUpcoming}
            hasMore={hasMoreUpcoming}
          />

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerContent: {
    gap: 2,
  },
  headerTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    height: 48,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xs,
  },
  heroSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  heroScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  searchResults: {
    flex: 1,
  },
  searchLoading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  searchListContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  searchRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  searchGridItem: {
    width: '48%',
  },
  searchLoadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
