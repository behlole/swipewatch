import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Avatar } from '../ui';
import { ProgressRing } from './ProgressRing';
import { useTheme, spacing, borderRadius } from '../../theme';
import { Participant } from '../../types';

interface ParticipantListProps {
  participants: Record<string, Participant>;
  hostId: string;
  showProgress?: boolean;
  compact?: boolean;
}

export function ParticipantList({
  participants,
  hostId,
  showProgress = false,
  compact = false,
}: ParticipantListProps) {
  const theme = useTheme();
  const participantEntries = Object.entries(participants);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {participantEntries.map(([id, participant], index) => (
          <View
            key={id}
            style={[
              styles.compactAvatar,
              index > 0 && { marginLeft: -12 },
              { borderColor: theme.colors.background.primary },
            ]}
          >
            <Avatar
              name={participant.displayName}
              source={participant.photoURL || undefined}
              size="sm"
            />
            {participant.status === 'completed' && (
              <View style={[styles.completedBadge, { backgroundColor: theme.colors.success }]}>
                <Ionicons name="checkmark" size={8} color="#FFF" />
              </View>
            )}
          </View>
        ))}
        <Text variant="caption" color="secondary" style={{ marginLeft: spacing.sm }}>
          {participantEntries.length} {participantEntries.length === 1 ? 'person' : 'people'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {participantEntries.map(([id, participant]) => (
        <View
          key={id}
          style={[
            styles.participantRow,
            { backgroundColor: theme.colors.background.secondary },
          ]}
        >
          <View style={styles.participantInfo}>
            <Avatar
              name={participant.displayName}
              source={participant.photoURL || undefined}
              size="md"
            />
            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text variant="body" style={{ fontWeight: '500' }}>
                  {participant.displayName}
                </Text>
                {id === hostId && (
                  <View style={[styles.hostBadge, { backgroundColor: theme.colors.primary[500] }]}>
                    <Text variant="caption" style={{ color: '#FFF', fontSize: 10 }}>
                      HOST
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="caption" color="secondary">
                {participant.status === 'completed'
                  ? 'Done swiping'
                  : participant.status === 'active'
                  ? showProgress
                    ? 'Swiping...'
                    : 'Ready'
                  : participant.status === 'left'
                  ? 'Left session'
                  : 'Inactive'}
              </Text>
            </View>
          </View>

          {showProgress ? (
            <ProgressRing
              progress={participant.swipeProgress}
              size={44}
              strokeWidth={3}
              color={
                participant.status === 'completed'
                  ? theme.colors.success
                  : theme.colors.primary[500]
              }
            />
          ) : (
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    participant.status === 'active'
                      ? theme.colors.success
                      : participant.status === 'completed'
                      ? theme.colors.primary[500]
                      : theme.colors.text.tertiary,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactAvatar: {
    borderWidth: 2,
    borderRadius: 20,
  },
  completedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hostBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
