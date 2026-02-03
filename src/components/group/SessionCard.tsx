import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { ParticipantList } from './ParticipantList';
import { useTheme, spacing, borderRadius } from '../../theme';
import { WatchParty } from '../../types';

interface SessionCardProps {
  session: WatchParty;
  onPress?: () => void;
  onDelete?: () => void;
}

export function SessionCard({ session, onPress, onDelete }: SessionCardProps) {
  const theme = useTheme();

  const participantCount = Object.keys(session.participants).length;
  const statusColor = {
    lobby: theme.colors.warning,
    swiping: theme.colors.primary[500],
    results: theme.colors.success,
    expired: theme.colors.text.tertiary,
  }[session.status];

  const statusLabel = {
    lobby: 'Waiting',
    swiping: 'In Progress',
    results: 'Complete',
    expired: 'Expired',
  }[session.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.background.secondary,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <Text variant="h3" style={{ letterSpacing: 2 }}>
            {session.code}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text variant="captionSmall" style={{ color: '#FFF', fontWeight: '600' }}>
              {statusLabel}
            </Text>
          </View>
        </View>
        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={theme.colors.text.tertiary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color="secondary">
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="film-outline" size={16} color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color="secondary">
            {session.settings.movieCount} {session.settings.contentType === 'tv' ? 'shows' : 'movies'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <ParticipantList
        participants={session.participants}
        hostId={session.hostId}
        compact
      />

      {session.status === 'lobby' && (
        <View style={[styles.joinPrompt, { backgroundColor: theme.colors.primary[500] + '20' }]}>
          <Text variant="caption" style={{ color: theme.colors.primary[500] }}>
            Tap to continue
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.primary[500]} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  info: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  joinPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
});
