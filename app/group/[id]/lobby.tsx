import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '../../../src/components/ui';
import { InviteCode, ParticipantList } from '../../../src/components/group';
import { useTheme, spacing, borderRadius } from '../../../src/theme';
import { useGroupStore } from '../../../src/features/groups/stores/groupStore';
import { useAuthStore } from '../../../src/features/auth/stores/authStore';
import { discoverMovies, discoverTV, transformMovie, transformTVShow } from '../../../src/services/tmdb';
import { Media } from '../../../src/types';

export default function LobbyScreen() {
  const theme = useTheme();
  const { id: code } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    currentSession,
    setMoviePool,
    startSwiping,
    isLoading,
    setLoading,
  } = useGroupStore();

  const [loadingMovies, setLoadingMovies] = useState(false);

  const isHost = currentSession?.hostId === user?.uid;
  const participantCount = Object.keys(currentSession?.participants || {}).length;
  const canStart = participantCount >= 2;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Watch Party! Use code: ${code}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Party',
      'Are you sure you want to leave this watch party?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            useGroupStore.getState().reset();
            router.replace('/(tabs)/groups');
          },
        },
      ]
    );
  };

  const fetchMovies = async (): Promise<Media[]> => {
    if (!currentSession) return [];

    const { settings } = currentSession;
    const params = {
      'vote_average.gte': settings.minRating,
      'vote_count.gte': 100,
      with_genres: settings.genres.length > 0
        ? settings.genres.join(',')
        : undefined,
      sort_by: 'popularity.desc',
    };

    let results: Media[] = [];

    if (settings.contentType === 'movie' || settings.contentType === 'both') {
      const movieParams = {
        ...params,
        'primary_release_date.gte': `${settings.minYear}-01-01`,
        'primary_release_date.lte': `${settings.maxYear}-12-31`,
      };
      const movieResponse = await discoverMovies(movieParams);
      results = [...results, ...movieResponse.results.map(transformMovie)];
    }

    if (settings.contentType === 'tv' || settings.contentType === 'both') {
      const tvParams = {
        ...params,
        'first_air_date.gte': `${settings.minYear}-01-01`,
        'first_air_date.lte': `${settings.maxYear}-12-31`,
      };
      const tvResponse = await discoverTV(tvParams);
      results = [...results, ...tvResponse.results.map(transformTVShow)];
    }

    // Filter out items without posters and shuffle
    results = results
      .filter((item) => item.posterPath)
      .sort(() => Math.random() - 0.5)
      .slice(0, settings.movieCount);

    return results;
  };

  const handleStart = async () => {
    if (!canStart) {
      Alert.alert(
        'Need More People',
        'You need at least 2 participants to start a watch party.'
      );
      return;
    }

    setLoadingMovies(true);
    try {
      const movies = await fetchMovies();
      if (movies.length === 0) {
        Alert.alert('No Results', 'No movies found matching your filters. Try adjusting your settings.');
        return;
      }

      setMoviePool(movies);
      startSwiping();
      router.replace(`/group/${code}/swipe`);
    } catch (error) {
      Alert.alert('Error', 'Failed to load movies. Please try again.');
      console.error('Fetch error:', error);
    } finally {
      setLoadingMovies(false);
    }
  };

  if (!currentSession) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      >
        <View style={styles.centered}>
          <Text variant="body" color="secondary">
            Session not found
          </Text>
          <Button
            variant="secondary"
            onPress={() => router.replace('/(tabs)/groups')}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable onPress={handleLeave} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="h3">Watch Party</Text>
        <Pressable onPress={handleShare} hitSlop={8}>
          <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Invite Code */}
        <View style={styles.codeSection}>
          <Text variant="body" color="secondary" align="center">
            Share this code with friends
          </Text>
          <InviteCode code={code || ''} />
        </View>

        {/* Session Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="film-outline" size={20} color={theme.colors.text.secondary} />
              <Text variant="body" color="secondary">
                {currentSession.settings.movieCount}{' '}
                {currentSession.settings.contentType === 'tv' ? 'shows' : 'movies'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="star-outline" size={20} color={theme.colors.text.secondary} />
              <Text variant="body" color="secondary">
                {currentSession.settings.minRating}+ rating
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
              <Text variant="body" color="secondary">
                {currentSession.settings.minYear} - {currentSession.settings.maxYear}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.text.secondary} />
              <Text variant="body" color="secondary">
                {currentSession.settings.genres.length === 0
                  ? 'All genres'
                  : `${currentSession.settings.genres.length} genres`}
              </Text>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.participantsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="h3">Participants</Text>
            <Text variant="body" color="secondary">
              {participantCount} {participantCount === 1 ? 'person' : 'people'}
            </Text>
          </View>
          <ParticipantList
            participants={currentSession.participants}
            hostId={currentSession.hostId}
          />
        </View>

        {/* Waiting message */}
        {!isHost && (
          <View style={[styles.waitingBanner, { backgroundColor: theme.colors.primary[500] + '20' }]}>
            <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary[500]} />
            <Text variant="body" style={{ color: theme.colors.primary[500] }}>
              Waiting for host to start...
            </Text>
          </View>
        )}
      </View>

      {/* Start Button (Host only) */}
      {isHost && (
        <View style={[styles.footer, { backgroundColor: theme.colors.background.primary }]}>
          <Button
            onPress={handleStart}
            loading={loadingMovies}
            disabled={!canStart}
            leftIcon="play"
          >
            {loadingMovies ? 'Loading Movies...' : 'Start Swiping'}
          </Button>
          {!canStart && (
            <Text variant="caption" color="secondary" align="center" style={{ marginTop: spacing.sm }}>
              Need at least 2 participants to start
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  codeSection: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  participantsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
});
