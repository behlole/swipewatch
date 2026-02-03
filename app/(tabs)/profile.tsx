import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Avatar, Card, Button, Chip, Skeleton } from '../../src/components/ui';
import { useTheme, spacing, borderRadius } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { useSwipeStore } from '../../src/features/swipe/stores/swipeStore';
import { useWatchlistStore } from '../../src/features/watchlist/stores/watchlistStore';
import { usePreferencesStore, STREAMING_SERVICES, ALL_GENRES } from '../../src/stores/preferencesStore';
import { useTasteStats } from '../../src/hooks/useTasteProfile';

export default function ProfileScreen() {
  const theme = useTheme();
  const { firebaseUser, signOut } = useAuth();
  const { swipedIds, swipeHistory } = useSwipeStore();
  const { items: watchlistItems } = useWatchlistStore();
  const {
    themeMode,
    setThemeMode,
    preferredGenres,
    toggleGenre,
    streamingServices,
    toggleStreamingService,
    notificationsEnabled,
    setNotificationsEnabled,
    setHasCompletedOnboarding,
  } = usePreferencesStore();
  const { stats: tasteStats, confidence, hasEnoughData, isLoading: tasteLoading } = useTasteStats();

  const [showGenresModal, setShowGenresModal] = useState(false);
  const [showStreamingModal, setShowStreamingModal] = useState(false);

  // Calculate stats
  const totalSwiped = swipedIds.size;
  const totalLiked = swipeHistory.filter((s) => s.direction === 'right').length;
  const watchlistCount = watchlistItems.length;
  const watchedCount = watchlistItems.filter((i) => i.watched).length;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the onboarding screens again next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setHasCompletedOnboarding(false);
            Alert.alert('Done', 'Onboarding will show on next app restart.');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will clear your swipe history and watchlist. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            useSwipeStore.getState().resetSession();
            useWatchlistStore.getState().clearAll();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
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
          <Avatar
            source={firebaseUser?.photoURL || undefined}
            name={firebaseUser?.displayName || 'User'}
            size="xl"
          />
          <Text variant="h2" style={styles.name}>
            {firebaseUser?.displayName || 'User'}
          </Text>
          <Text variant="body" color="secondary">
            {firebaseUser?.email}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Swiped"
            value={totalSwiped.toString()}
            icon="layers-outline"
            color={theme.colors.primary[500]}
          />
          <StatCard
            label="Liked"
            value={totalLiked.toString()}
            icon="heart-outline"
            color={theme.colors.accent.like}
          />
          <StatCard
            label="Watchlist"
            value={watchlistCount.toString()}
            icon="bookmark-outline"
            color={theme.colors.accent.watchlist}
          />
          <StatCard
            label="Watched"
            value={watchedCount.toString()}
            icon="checkmark-circle-outline"
            color={theme.colors.accent.yellow}
          />
        </View>

        {/* AI Taste Profile Section */}
        <View style={styles.section}>
          <View style={styles.aiSectionHeader}>
            <LinearGradient
              colors={[theme.colors.accent.ai + '20', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiHeaderGradient}
            >
              <View style={styles.aiTitleRow}>
                <View style={[styles.aiIconContainer, { backgroundColor: theme.colors.accent.aiBg }]}>
                  <Ionicons name="sparkles" size={16} color={theme.colors.accent.ai} />
                </View>
                <Text variant="h4" style={styles.sectionTitle}>AI Taste Profile</Text>
                <View style={[styles.aiBadge, { backgroundColor: theme.colors.accent.aiBg }]}>
                  <Text variant="caption" style={{ color: theme.colors.accent.ai, fontWeight: '600', fontSize: 10 }}>
                    AI
                  </Text>
                </View>
              </View>
              {hasEnoughData && (
                <View style={[styles.confidenceBadge, {
                  backgroundColor: confidence === 'high' ? theme.colors.accent.like + '20' :
                    confidence === 'medium' ? theme.colors.accent.ai + '20' : theme.colors.background.tertiary
                }]}>
                  <Ionicons
                    name={confidence === 'high' ? 'checkmark-circle' : confidence === 'medium' ? 'trending-up' : 'bulb-outline'}
                    size={12}
                    color={confidence === 'high' ? theme.colors.accent.like :
                      confidence === 'medium' ? theme.colors.accent.ai : theme.colors.text.secondary}
                  />
                  <Text variant="caption" style={{
                    color: confidence === 'high' ? theme.colors.accent.like :
                      confidence === 'medium' ? theme.colors.accent.ai : theme.colors.text.secondary,
                    fontWeight: '500',
                    fontSize: 11,
                  }}>
                    {confidence === 'high' ? 'Highly trained' : confidence === 'medium' ? 'Learning' : 'Getting started'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {tasteLoading ? (
            <View style={[styles.tasteCard, { backgroundColor: theme.colors.background.secondary }]}>
              <Skeleton width="100%" height={20} borderRadius={8} />
              <Skeleton width="80%" height={20} borderRadius={8} style={{ marginTop: spacing.sm }} />
              <Skeleton width="60%" height={20} borderRadius={8} style={{ marginTop: spacing.sm }} />
            </View>
          ) : hasEnoughData ? (
            <View style={[styles.tasteCard, { backgroundColor: theme.colors.background.secondary }]}>
              {/* Top Genres */}
              <View style={styles.tasteSection}>
                <View style={styles.tasteSectionHeader}>
                  <Ionicons name="film-outline" size={16} color={theme.colors.accent.ai} />
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>Favorite Genres</Text>
                </View>
                {tasteStats.topGenres.length > 0 ? (
                  <View style={styles.genreList}>
                    {tasteStats.topGenres.map((genre, index) => (
                      <View key={genre.id} style={styles.genreItem}>
                        <View style={styles.genreInfo}>
                          <Text variant="bodySmall" numberOfLines={1}>{genre.name}</Text>
                          <Text variant="caption" color="tertiary">{Math.round(genre.score * 100)}% match</Text>
                        </View>
                        <View style={[styles.genreBar, { backgroundColor: theme.colors.background.tertiary }]}>
                          <LinearGradient
                            colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.genreBarFill, { width: `${genre.score * 100}%` }]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text variant="caption" color="secondary">Keep swiping to discover your taste</Text>
                )}
              </View>

              {/* Taste Stats Row */}
              <View style={[styles.tasteStatsRow, { borderTopColor: theme.colors.border.subtle }]}>
                <View style={styles.tasteStat}>
                  <Text variant="h4" style={{ color: theme.colors.accent.ai }}>{tasteStats.likeRate}%</Text>
                  <Text variant="caption" color="secondary">Like Rate</Text>
                </View>
                <View style={[styles.tasteStatDivider, { backgroundColor: theme.colors.border.subtle }]} />
                <View style={styles.tasteStat}>
                  <Text variant="h4" style={{ color: theme.colors.accent.ai }}>{tasteStats.avgRatingLiked}</Text>
                  <Text variant="caption" color="secondary">Avg Rating</Text>
                </View>
                <View style={[styles.tasteStatDivider, { backgroundColor: theme.colors.border.subtle }]} />
                <View style={styles.tasteStat}>
                  <Text variant="h4" style={{ color: theme.colors.accent.ai }}>{tasteStats.preferredDecades[0] || '—'}s</Text>
                  <Text variant="caption" color="secondary">Era</Text>
                </View>
              </View>

              {/* View Detailed Analytics Button */}
              <Pressable
                onPress={() => router.push('/analytics')}
                style={({ pressed }) => [
                  styles.analyticsButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <LinearGradient
                  colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.analyticsButtonGradient}
                >
                  <Ionicons name="analytics" size={16} color="#FFF" />
                  <Text variant="bodySmall" style={{ color: '#FFF', fontWeight: '600' }}>
                    View Detailed Analytics
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/(onboarding)/taste')}
              style={({ pressed }) => [
                styles.tasteEmptyState,
                { backgroundColor: theme.colors.background.secondary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <LinearGradient
                colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tasteEmptyIcon}
              >
                <Ionicons name="bulb-outline" size={24} color="#FFF" />
              </LinearGradient>
              <Text variant="body" style={{ fontWeight: '600' }}>Train your AI</Text>
              <Text variant="caption" color="secondary" align="center">
                Like a few more movies to unlock personalized insights
              </Text>
              <View style={[styles.trainButton, { backgroundColor: theme.colors.accent.aiBg }]}>
                <Ionicons name="heart" size={14} color={theme.colors.accent.ai} />
                <Text variant="bodySmall" style={{ color: theme.colors.accent.ai, fontWeight: '600' }}>
                  Start Training
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconSmall, { backgroundColor: theme.colors.accent.like + '20' }]}>
              <Ionicons name="options-outline" size={14} color={theme.colors.accent.like} />
            </View>
            <Text variant="h4" style={styles.sectionTitle}>Preferences</Text>
          </View>
          <Card variant="filled" padding="xs">
            <SettingsItem
              icon="heart-outline"
              label="Favorite Genres"
              value={preferredGenres.length > 0 ? `${preferredGenres.length} selected` : 'None'}
              onPress={() => setShowGenresModal(true)}
            />
            <SettingsItem
              icon="tv-outline"
              label="Streaming Services"
              value={streamingServices.length > 0 ? `${streamingServices.length} selected` : 'None'}
              onPress={() => setShowStreamingModal(true)}
            />
          </Card>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconSmall, { backgroundColor: theme.colors.primary[500] + '20' }]}>
              <Ionicons name="settings-outline" size={14} color={theme.colors.primary[500]} />
            </View>
            <Text variant="h4" style={styles.sectionTitle}>Settings</Text>
          </View>
          <Card variant="filled" padding="xs">
            <View style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <Ionicons name="notifications-outline" size={22} color={theme.colors.text.secondary} />
                <Text variant="body">Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: theme.colors.background.tertiary,
                  true: theme.colors.primary[500],
                }}
                thumbColor="#FFFFFF"
              />
            </View>
            <SettingsItem
              icon="moon-outline"
              label="Theme"
              value={themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
              onPress={() => {
                const modes: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
                const currentIndex = modes.indexOf(themeMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setThemeMode(nextMode);
              }}
            />
            <SettingsItem
              icon="refresh-outline"
              label="Reset Onboarding"
              onPress={handleResetOnboarding}
            />
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconSmall, { backgroundColor: theme.colors.info + '20' }]}>
              <Ionicons name="help-buoy-outline" size={14} color={theme.colors.info} />
            </View>
            <Text variant="h4" style={styles.sectionTitle}>Support</Text>
          </View>
          <Card variant="filled" padding="xs">
            <SettingsItem
              icon="help-circle-outline"
              label="Help & FAQ"
              onPress={() => {}}
            />
            <SettingsItem
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => {}}
            />
            <SettingsItem
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconSmall, { backgroundColor: theme.colors.error + '20' }]}>
              <Ionicons name="server-outline" size={14} color={theme.colors.error} />
            </View>
            <Text variant="h4" style={styles.sectionTitle}>Data</Text>
          </View>
          <Pressable
            onPress={handleClearData}
            style={[styles.dangerButton, { backgroundColor: theme.colors.error + '20' }]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text variant="body" style={{ color: theme.colors.error }}>
              Clear All Data
            </Text>
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          style={[styles.signOutButton, { backgroundColor: theme.colors.background.secondary }]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text variant="body" style={{ color: theme.colors.error }}>
            Sign Out
          </Text>
        </Pressable>

        <Text variant="caption" color="tertiary" align="center" style={styles.version}>
          SwipeWatch v1.0.0
        </Text>
      </ScrollView>

      {/* Genres Modal */}
      <Modal
        visible={showGenresModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGenresModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text variant="h3">Favorite Genres</Text>
            <Pressable onPress={() => setShowGenresModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.genreGrid}>
              {ALL_GENRES.map((genre) => (
                <Chip
                  key={genre.id}
                  label={genre.name}
                  selected={preferredGenres.includes(genre.id)}
                  onPress={() => toggleGenre(genre.id)}
                />
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button onPress={() => setShowGenresModal(false)}>Done</Button>
          </View>
        </View>
      </Modal>

      {/* Streaming Services Modal */}
      <Modal
        visible={showStreamingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStreamingModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text variant="h3">Streaming Services</Text>
            <Pressable onPress={() => setShowStreamingModal(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {STREAMING_SERVICES.map((service) => {
              const isSelected = streamingServices.includes(service.id);
              return (
                <Pressable
                  key={service.id}
                  onPress={() => toggleStreamingService(service.id)}
                  style={[
                    styles.streamingItem,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary[500] + '20'
                        : theme.colors.background.secondary,
                      borderColor: isSelected
                        ? theme.colors.primary[500]
                        : 'transparent',
                    },
                  ]}
                >
                  <Text variant="body">{service.name}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[500]} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button onPress={() => setShowStreamingModal(false)}>Done</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text variant="h3">{value}</Text>
      <Text variant="captionSmall" color="secondary">
        {label}
      </Text>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        { backgroundColor: pressed ? theme.colors.background.tertiary : 'transparent' },
      ]}
    >
      <View style={styles.settingsItemLeft}>
        <Ionicons name={icon as any} size={22} color={theme.colors.text.secondary} />
        <Text variant="body">{label}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && (
          <Text variant="bodySmall" color="secondary">
            {value}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  name: {
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    gap: 4,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  section: {
    padding: spacing.screenPadding,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  version: {
    marginVertical: spacing.xl,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  modalContent: {
    padding: spacing.screenPadding,
  },
  modalFooter: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  streamingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  // AI Taste Profile Styles
  aiSectionHeader: {
    marginBottom: spacing.md,
  },
  aiHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    marginHorizontal: -spacing.sm,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tasteCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  tasteSection: {
    gap: spacing.sm,
  },
  tasteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genreList: {
    gap: spacing.sm,
  },
  genreItem: {
    gap: spacing.xs,
  },
  genreInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  genreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tasteStatsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  tasteStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tasteStatDivider: {
    width: 1,
    height: 36,
  },
  tasteEmptyState: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  tasteEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  trainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  analyticsButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  analyticsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
});
