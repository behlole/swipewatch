import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../../../src/components/ui';
import { SwipeStack } from '../../../src/components/swipe';
import { ParticipantList, ProgressRing } from '../../../src/components/group';
import { useTheme, spacing } from '../../../src/theme';
import { useGroupStore } from '../../../src/features/groups/stores/groupStore';
import { useAuthStore } from '../../../src/features/auth/stores/authStore';
import { Media, SwipeDirection } from '../../../src/types';

export default function GroupSwipeScreen() {
  const theme = useTheme();
  const { id: code } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    currentSession,
    moviePool,
    recordSwipe,
  } = useGroupStore();

  const [localIndex, setLocalIndex] = useState(0);
  const totalItems = moviePool.length;
  const progress = totalItems > 0 ? ((localIndex / totalItems) * 100) : 0;
  const isCompleted = localIndex >= totalItems;

  // Navigate to results when all done
  React.useEffect(() => {
    if (currentSession?.status === 'results') {
      router.replace(`/group/${code}/results`);
    }
  }, [currentSession?.status, code]);

  const handleSwipe = useCallback(
    (media: Media, direction: SwipeDirection) => {
      if (!user) return;

      Haptics.impactAsync(
        direction === 'right'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );

      recordSwipe(user.uid, media.id.toString(), direction === 'right');
      setLocalIndex((prev) => prev + 1);
    },
    [user, recordSwipe]
  );

  if (!currentSession) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      >
        <View style={styles.centered}>
          <Text variant="body" color="secondary">
            Session not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text variant="h3">Watch Party</Text>
        </View>

        <View style={styles.completedContainer}>
          <View
            style={[styles.completedIcon, { backgroundColor: theme.colors.success + '20' }]}
          >
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>
          <Text variant="h2" align="center">
            You're Done!
          </Text>
          <Text variant="body" color="secondary" align="center">
            Waiting for others to finish swiping...
          </Text>

          <View style={styles.waitingSection}>
            <Text variant="label" color="secondary">
              PARTICIPANT PROGRESS
            </Text>
            <ParticipantList
              participants={currentSession.participants}
              hostId={currentSession.hostId}
              showProgress
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <ProgressRing progress={progress} size={44} strokeWidth={3} />
          <View>
            <Text variant="bodySmall" color="secondary">
              Progress
            </Text>
            <Text variant="body" style={{ fontWeight: '600' }}>
              {localIndex + 1} of {totalItems}
            </Text>
          </View>
        </View>

        <ParticipantList
          participants={currentSession.participants}
          hostId={currentSession.hostId}
          compact
        />
      </View>

      {/* Swipe Stack */}
      <View style={styles.swipeContainer}>
        <SwipeStack
          items={moviePool}
          onSwipe={handleSwipe}
        />
      </View>

      {/* Actions are handled by SwipeStack */}

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text variant="caption" color="tertiary" align="center">
          Swipe right on movies you'd watch together
        </Text>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  swipeContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  completedContainer: {
    flex: 1,
    padding: spacing.screenPadding,
    alignItems: 'center',
    gap: spacing.lg,
  },
  completedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['4xl'],
    marginBottom: spacing.lg,
  },
  waitingSection: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
