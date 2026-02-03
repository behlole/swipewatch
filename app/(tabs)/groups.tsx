import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '../../src/components/ui';
import { SessionCard } from '../../src/components/group';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { useGroupStore } from '../../src/features/groups/stores/groupStore';
import { useAuthStore } from '../../src/features/auth/stores/authStore';

export default function GroupsScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { currentSession, joinLocalSession, reset } = useGroupStore();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateParty = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create a watch party.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }
    router.push('/group/create');
  };

  const handleJoinParty = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join a watch party.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }

    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character party code.');
      return;
    }

    const success = joinLocalSession(code, user.uid, user.displayName || 'Guest');
    if (success) {
      setJoinCode('');
      setShowJoinInput(false);
      router.push(`/group/${code}/lobby`);
    } else {
      Alert.alert('Join Failed', 'Could not find a party with that code. Make sure the code is correct and the party is still in the lobby.');
    }
  };

  const handleContinueSession = () => {
    if (!currentSession) return;

    switch (currentSession.status) {
      case 'lobby':
        router.push(`/group/${currentSession.code}/lobby`);
        break;
      case 'swiping':
        router.push(`/group/${currentSession.code}/swipe`);
        break;
      case 'results':
        router.push(`/group/${currentSession.code}/results`);
        break;
    }
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Leave Party',
      'Are you sure you want to leave this watch party?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: reset },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1">Watch Parties</Text>
          <Text variant="body" color="secondary">
            Find movies everyone will love
          </Text>
        </View>

        {/* Active Session */}
        {currentSession && (
          <View style={styles.section}>
            <Text variant="label" color="secondary" style={styles.sectionLabel}>
              ACTIVE PARTY
            </Text>
            <SessionCard
              session={currentSession}
              onPress={handleContinueSession}
              onDelete={handleDeleteSession}
            />
          </View>
        )}

        {/* Actions */}
        {!currentSession && (
          <>
            {/* Create Section */}
            <View style={styles.section}>
              <View
                style={[styles.actionCard, { backgroundColor: theme.colors.background.secondary }]}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="add-circle"
                    size={40}
                    color={theme.colors.primary[500]}
                  />
                </View>
                <View style={styles.actionInfo}>
                  <Text variant="h3">Create a Party</Text>
                  <Text variant="bodySmall" color="secondary">
                    Start a new watch party and invite friends
                  </Text>
                </View>
                <Button
                  size="sm"
                  onPress={handleCreateParty}
                >
                  Create
                </Button>
              </View>
            </View>

            {/* Join Section */}
            <View style={styles.section}>
              <View
                style={[styles.actionCard, { backgroundColor: theme.colors.background.secondary }]}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="enter"
                    size={40}
                    color={theme.colors.primary[400]}
                  />
                </View>
                <View style={styles.actionInfo}>
                  <Text variant="h3">Join a Party</Text>
                  <Text variant="bodySmall" color="secondary">
                    Enter a code to join friends
                  </Text>
                </View>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => setShowJoinInput(!showJoinInput)}
                >
                  Join
                </Button>
              </View>

              {showJoinInput && (
                <View style={[styles.joinInputContainer, { backgroundColor: theme.colors.background.secondary }]}>
                  <TextInput
                    style={[
                      styles.codeInput,
                      {
                        backgroundColor: theme.colors.background.tertiary,
                        color: theme.colors.text.primary,
                      },
                    ]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={joinCode}
                    onChangeText={(text) => setJoinCode(text.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <Button
                    onPress={handleJoinParty}
                    disabled={joinCode.length !== 6}
                  >
                    Join Party
                  </Button>
                </View>
              )}
            </View>
          </>
        )}

        {/* How it Works */}
        <View style={styles.section}>
          <Text variant="label" color="secondary" style={styles.sectionLabel}>
            HOW IT WORKS
          </Text>
          <View style={[styles.stepsCard, { backgroundColor: theme.colors.background.secondary }]}>
            {[
              { icon: 'people', text: 'Create a party and invite friends' },
              { icon: 'hand-left', text: 'Everyone swipes on movies' },
              { icon: 'heart', text: 'See which movies you all liked' },
              { icon: 'tv', text: 'Watch together!' },
            ].map((step, index) => (
              <View key={index} style={styles.step}>
                <View
                  style={[styles.stepNumber, { backgroundColor: theme.colors.primary[500] }]}
                >
                  <Ionicons name={step.icon as any} size={18} color="#FFF" />
                </View>
                <Text variant="body" style={{ flex: 1 }}>
                  {step.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  actionIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  joinInputContainer: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  stepsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
