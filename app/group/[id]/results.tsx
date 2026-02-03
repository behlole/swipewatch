import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text, Button } from '../../../src/components/ui';
import { MatchCard, ParticipantList } from '../../../src/components/group';
import { useTheme, spacing, borderRadius } from '../../../src/theme';
import { useGroupStore } from '../../../src/features/groups/stores/groupStore';
import { useWatchlistStore } from '../../../src/features/watchlist/stores/watchlistStore';
import { Media } from '../../../src/types';

export default function ResultsScreen() {
  const theme = useTheme();
  const { id: code } = useLocalSearchParams<{ id: string }>();
  const { currentSession, matches, moviePool, reset } = useGroupStore();
  const { addItem } = useWatchlistStore();

  const confettiAnim = useRef(new Animated.Value(0)).current;

  const participantCount = Object.keys(currentSession?.participants || {}).length;
  const unanimousMatches = matches.filter((m) => m.isUnanimous);
  const otherMatches = matches.filter((m) => !m.isUnanimous);

  useEffect(() => {
    if (unanimousMatches.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 500,
          delay: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unanimousMatches.length]);

  const handleAddToWatchlist = (match: typeof matches[0]) => {
    const movie = moviePool.find((m) => m.id.toString() === match.movieId);
    if (movie) {
      addItem(movie, 'group');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleMoviePress = (match: typeof matches[0]) => {
    const movie = moviePool.find((m) => m.id.toString() === match.movieId);
    if (movie) {
      router.push(`/media/${movie.type}/${movie.id}`);
    }
  };

  const handleNewParty = () => {
    reset();
    router.replace('/group/create');
  };

  const handleGoHome = () => {
    reset();
    router.replace('/(tabs)/groups');
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
            Go Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const hasMatches = matches.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            {hasMatches ? (
              <Animated.View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.success + '20' },
                  {
                    transform: [
                      {
                        scale: confettiAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.2, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="heart" size={48} color={theme.colors.success} />
              </Animated.View>
            ) : (
              <View
                style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '20' }]}
              >
                <Ionicons name="sad-outline" size={48} color={theme.colors.warning} />
              </View>
            )}
          </View>

          <Text variant="h1" align="center">
            {hasMatches
              ? unanimousMatches.length > 0
                ? 'Perfect Match!'
                : 'You Have Matches!'
              : 'No Matches Yet'}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {hasMatches
              ? `${matches.length} ${matches.length === 1 ? 'movie' : 'movies'} everyone would watch`
              : "No one liked the same movies. Try a new party with different filters!"}
          </Text>
        </View>

        {/* Perfect Matches */}
        {unanimousMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.badge, { backgroundColor: theme.colors.success }]}>
                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                <Text variant="label" style={{ color: '#FFF' }}>
                  PERFECT MATCHES
                </Text>
              </View>
              <Text variant="caption" color="secondary">
                Everyone liked these!
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchScroll}
            >
              {unanimousMatches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  rank={index + 1}
                  participantCount={participantCount}
                  onPress={() => handleMoviePress(match)}
                />
              ))}
            </ScrollView>
            <Pressable
              onPress={() => unanimousMatches.forEach(handleAddToWatchlist)}
              style={[styles.addAllButton, { backgroundColor: theme.colors.background.secondary }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary[500]} />
              <Text variant="body" style={{ color: theme.colors.primary[500] }}>
                Add all to watchlist
              </Text>
            </Pressable>
          </View>
        )}

        {/* Other Matches */}
        {otherMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="h3">Other Matches</Text>
              <Text variant="caption" color="secondary">
                Most people liked these
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchScroll}
            >
              {otherMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  participantCount={participantCount}
                  onPress={() => handleMoviePress(match)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Participants */}
        <View style={styles.section}>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            Participants
          </Text>
          <ParticipantList
            participants={currentSession.participants}
            hostId={currentSession.hostId}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            onPress={handleNewParty}
            leftIcon="add-circle-outline"
          >
            Start New Party
          </Button>
          <Button
            variant="secondary"
            onPress={handleGoHome}
          >
            Back to Groups
          </Button>
        </View>
      </ScrollView>
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
    padding: spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    padding: spacing.screenPadding,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  headerIcon: {
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  matchScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionsSection: {
    padding: spacing.screenPadding,
    paddingBottom: spacing['4xl'],
    gap: spacing.md,
  },
});
