import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Skeleton } from '../src/components/ui';
import { useTheme, spacing, borderRadius } from '../src/theme';
import {
  useAnalytics,
  formatNumber,
  getShortDayName,
  formatHour,
  getTimeOfDayLabel,
  getConfidenceColor,
  getMaturityLabel,
} from '../src/hooks/useAnalytics';
import { AdBanner } from '../src/features/ads';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const { analytics, isLoading, refresh } = useAnalytics();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Stack.Screen
          options={{
            title: 'Your Analytics',
            headerStyle: { backgroundColor: theme.colors.background.primary },
            headerTintColor: theme.colors.text.primary,
          }}
        />
        <ScrollView style={styles.content}>
          <View style={styles.loadingContainer}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={120} borderRadius={16} style={{ marginBottom: spacing.md }} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Stack.Screen
          options={{
            title: 'Your Analytics',
            headerStyle: { backgroundColor: theme.colors.background.primary },
            headerTintColor: theme.colors.text.primary,
          }}
        />
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color={theme.colors.text.tertiary} />
          <Text variant="h3" align="center">No Analytics Yet</Text>
          <Text variant="body" color="secondary" align="center">
            Start swiping to generate personalized insights
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { swipeStats, genreInsights, viewingPatterns, contentPreferences, peoplePreferences, aiInsights } = analytics;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Your Analytics',
          headerStyle: { backgroundColor: theme.colors.background.primary },
          headerTintColor: theme.colors.text.primary,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: spacing.sm }}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Personality Card */}
        <LinearGradient
          colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.personalityCard}
        >
          <View style={styles.personalityHeader}>
            <View style={styles.sparkleIcon}>
              <Ionicons name="sparkles" size={24} color="#FFF" />
            </View>
            <Text variant="h3" style={styles.personalityTitle}>Your Movie Personality</Text>
          </View>
          <Text variant="h2" style={styles.moodProfile}>{aiInsights.moodProfile}</Text>
          <View style={styles.personalityStats}>
            <View style={styles.personalityStat}>
              <Text variant="caption" style={styles.personalityStatLabel}>Confidence</Text>
              <Text variant="body" style={styles.personalityStatValue}>
                {aiInsights.confidence.charAt(0).toUpperCase() + aiInsights.confidence.slice(1)}
              </Text>
            </View>
            <View style={styles.personalityStatDivider} />
            <View style={styles.personalityStat}>
              <Text variant="caption" style={styles.personalityStatLabel}>Taste Level</Text>
              <Text variant="body" style={styles.personalityStatValue}>
                {getMaturityLabel(aiInsights.tasteMaturity).split(' ')[0]}
              </Text>
            </View>
            <View style={styles.personalityStatDivider} />
            <View style={styles.personalityStat}>
              <Text variant="caption" style={styles.personalityStatLabel}>Style</Text>
              <Text variant="body" style={styles.personalityStatValue}>
                {aiInsights.qualityVsPopularity === 'quality_seeker' ? 'Critic' :
                  aiInsights.qualityVsPopularity === 'mainstream' ? 'Popular' : 'Balanced'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Swipe Stats */}
        <SectionCard
          title="Swipe Statistics"
          icon="layers-outline"
          iconColor={theme.colors.primary[500]}
          theme={theme}
        >
          <View style={styles.statsGrid}>
            <StatItem label="Total Swipes" value={formatNumber(swipeStats.totalSwipes)} theme={theme} />
            <StatItem label="Likes" value={formatNumber(swipeStats.totalLikes)} theme={theme} color={theme.colors.accent.like} />
            <StatItem label="Passes" value={formatNumber(swipeStats.totalDislikes)} theme={theme} color={theme.colors.accent.nope} />
            <StatItem label="Like Rate" value={`${swipeStats.likeRate}%`} theme={theme} />
          </View>
          <View style={[styles.statRow, { borderTopColor: theme.colors.border.subtle }]}>
            <View style={styles.statRowItem}>
              <Ionicons name="flame" size={16} color={theme.colors.accent.nope} />
              <Text variant="bodySmall" color="secondary">Current Streak</Text>
              <Text variant="body" style={{ fontWeight: '600' }}>{swipeStats.currentStreak} days</Text>
            </View>
            <View style={styles.statRowItem}>
              <Ionicons name="trophy" size={16} color={theme.colors.accent.yellow} />
              <Text variant="bodySmall" color="secondary">Best Streak</Text>
              <Text variant="body" style={{ fontWeight: '600' }}>{swipeStats.longestStreak} days</Text>
            </View>
            <View style={styles.statRowItem}>
              <Ionicons name="trending-up" size={16} color={theme.colors.accent.like} />
              <Text variant="bodySmall" color="secondary">Daily Avg</Text>
              <Text variant="body" style={{ fontWeight: '600' }}>{swipeStats.avgSwipesPerDay}</Text>
            </View>
          </View>
        </SectionCard>

        {/* Ad Banner */}
        <AdBanner placement="analytics_section" size="mediumRectangle" />

        {/* Genre Insights */}
        <SectionCard
          title="Genre Preferences"
          icon="film-outline"
          iconColor={theme.colors.accent.ai}
          theme={theme}
        >
          {genreInsights.topGenres.length > 0 ? (
            <>
              {genreInsights.topGenres.slice(0, 5).map((genre, index) => (
                <View key={genre.id} style={styles.genreRow}>
                  <View style={styles.genreRank}>
                    <Text variant="caption" style={{ color: theme.colors.accent.ai, fontWeight: '700' }}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.genreInfo}>
                    <Text variant="body" style={{ fontWeight: '500' }}>{genre.name}</Text>
                    <Text variant="caption" color="tertiary">{genre.likeCount} movies liked</Text>
                  </View>
                  <View style={[styles.genreBarContainer, { backgroundColor: theme.colors.background.tertiary }]}>
                    <LinearGradient
                      colors={[theme.colors.accent.ai, theme.colors.accent.aiGradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.genreBarFill, { width: `${genre.percentage}%` }]}
                    />
                  </View>
                  <Text variant="bodySmall" style={{ width: 40, textAlign: 'right', fontWeight: '600' }}>
                    {genre.percentage}%
                  </Text>
                </View>
              ))}
              <View style={[styles.explorationScore, { backgroundColor: theme.colors.background.tertiary }]}>
                <Ionicons name="compass-outline" size={18} color={theme.colors.accent.ai} />
                <View style={styles.explorationInfo}>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>Genre Exploration</Text>
                  <Text variant="caption" color="secondary">
                    You've explored {genreInsights.genreExplorationScore}% of all genres
                  </Text>
                </View>
                <Text variant="h4" style={{ color: theme.colors.accent.ai }}>
                  {genreInsights.genreExplorationScore}%
                </Text>
              </View>
            </>
          ) : (
            <Text variant="body" color="secondary" align="center">
              Keep swiping to discover your genre preferences
            </Text>
          )}
        </SectionCard>

        {/* Viewing Patterns */}
        <SectionCard
          title="Viewing Patterns"
          icon="time-outline"
          iconColor={theme.colors.accent.watchlist}
          theme={theme}
        >
          <View style={styles.patternGrid}>
            <View style={[styles.patternCard, { backgroundColor: theme.colors.background.tertiary }]}>
              <Ionicons name="flash" size={20} color={theme.colors.accent.yellow} />
              <Text variant="caption" color="secondary">Quick Decisions</Text>
              <Text variant="h4">{viewingPatterns.quickDecisionRate}%</Text>
            </View>
            <View style={[styles.patternCard, { backgroundColor: theme.colors.background.tertiary }]}>
              <Ionicons name="hourglass" size={20} color={theme.colors.accent.ai} />
              <Text variant="caption" color="secondary">Thoughtful Picks</Text>
              <Text variant="h4">{viewingPatterns.deliberateDecisionRate}%</Text>
            </View>
          </View>

          <Text variant="bodySmall" style={[styles.subSectionTitle, { color: theme.colors.text.secondary }]}>
            Peak Hours
          </Text>
          <View style={styles.peakHoursRow}>
            {viewingPatterns.peakHours.slice(0, 4).map((hour) => (
              <View key={hour} style={[styles.hourChip, { backgroundColor: theme.colors.accent.watchlist + '20' }]}>
                <Text variant="bodySmall" style={{ color: theme.colors.accent.watchlist, fontWeight: '600' }}>
                  {formatHour(hour)}
                </Text>
              </View>
            ))}
          </View>

          <Text variant="bodySmall" style={[styles.subSectionTitle, { color: theme.colors.text.secondary }]}>
            Most Active Days
          </Text>
          <View style={styles.peakDaysRow}>
            {viewingPatterns.peakDays.map((day, i) => (
              <View key={day} style={[styles.dayChip, { backgroundColor: i === 0 ? theme.colors.primary[500] : theme.colors.background.tertiary }]}>
                <Text variant="bodySmall" style={{ color: i === 0 ? '#FFF' : theme.colors.text.primary, fontWeight: '600' }}>
                  {getShortDayName(day)}
                </Text>
              </View>
            ))}
          </View>

          <Text variant="bodySmall" style={[styles.subSectionTitle, { color: theme.colors.text.secondary }]}>
            Time of Day Breakdown
          </Text>
          {(['morning', 'afternoon', 'evening', 'night'] as const).map((time) => {
            const stats = viewingPatterns.timeOfDayPreferences[time];
            if (stats.swipeCount === 0) return null;
            return (
              <View key={time} style={styles.timeOfDayRow}>
                <Text variant="bodySmall" style={{ width: 80 }}>{getTimeOfDayLabel(time).split(' ')[0]}</Text>
                <View style={[styles.timeBar, { backgroundColor: theme.colors.background.tertiary }]}>
                  <View
                    style={[
                      styles.timeBarFill,
                      {
                        backgroundColor: theme.colors.accent.like,
                        width: `${stats.likeRate}%`,
                      },
                    ]}
                  />
                </View>
                <Text variant="caption" color="secondary" style={{ width: 50, textAlign: 'right' }}>
                  {stats.likeRate}% likes
                </Text>
              </View>
            );
          })}
        </SectionCard>

        {/* Content Preferences */}
        <SectionCard
          title="Content Preferences"
          icon="heart-outline"
          iconColor={theme.colors.accent.like}
          theme={theme}
        >
          <View style={styles.prefGrid}>
            <View style={[styles.prefCard, { backgroundColor: theme.colors.background.tertiary }]}>
              <Ionicons name="star" size={20} color={theme.colors.accent.yellow} />
              <Text variant="caption" color="secondary">Avg Rating</Text>
              <Text variant="h4">{contentPreferences.avgRatingLiked}</Text>
            </View>
            <View style={[styles.prefCard, { backgroundColor: theme.colors.background.tertiary }]}>
              <Ionicons name="timer" size={20} color={theme.colors.accent.watchlist} />
              <Text variant="caption" color="secondary">Avg Runtime</Text>
              <Text variant="h4">{contentPreferences.avgRuntimePreferred}m</Text>
            </View>
          </View>

          {contentPreferences.preferredDecades.length > 0 && (
            <>
              <Text variant="bodySmall" style={[styles.subSectionTitle, { color: theme.colors.text.secondary }]}>
                Favorite Eras
              </Text>
              <View style={styles.decadeRow}>
                {contentPreferences.preferredDecades.map((d) => (
                  <View key={d.decade} style={[styles.decadeChip, { backgroundColor: theme.colors.accent.ai + '20' }]}>
                    <Text variant="bodySmall" style={{ color: theme.colors.accent.ai, fontWeight: '600' }}>
                      {d.decade}s
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </SectionCard>

        {/* People Preferences */}
        {(peoplePreferences.topActors.length > 0 || peoplePreferences.topDirectors.length > 0) && (
          <SectionCard
            title="Favorite People"
            icon="people-outline"
            iconColor={theme.colors.info}
            theme={theme}
          >
            {peoplePreferences.topActors.length > 0 && (
              <>
                <Text variant="bodySmall" style={[styles.subSectionTitle, { color: theme.colors.text.secondary }]}>
                  Top Actors
                </Text>
                {peoplePreferences.topActors.slice(0, 5).map((actor, i) => (
                  <View key={actor.id} style={styles.personRow}>
                    <Text variant="caption" style={{ color: theme.colors.info, fontWeight: '700', width: 24 }}>
                      #{i + 1}
                    </Text>
                    <Text variant="body" style={{ flex: 1 }}>{actor.name}</Text>
                    <Text variant="caption" color="tertiary">{actor.movieCount} films</Text>
                  </View>
                ))}
              </>
            )}

            {peoplePreferences.topDirectors.length > 0 && (
              <>
                <Text variant="bodySmall" style={[styles.subSectionTitle, { color: theme.colors.text.secondary, marginTop: spacing.md }]}>
                  Top Directors
                </Text>
                {peoplePreferences.topDirectors.slice(0, 5).map((director, i) => (
                  <View key={director.id} style={styles.personRow}>
                    <Text variant="caption" style={{ color: theme.colors.info, fontWeight: '700', width: 24 }}>
                      #{i + 1}
                    </Text>
                    <Text variant="body" style={{ flex: 1 }}>{director.name}</Text>
                    <Text variant="caption" color="tertiary">{director.movieCount} films</Text>
                  </View>
                ))}
              </>
            )}
          </SectionCard>
        )}

        {/* AI Insights */}
        <SectionCard
          title="AI Insights"
          icon="sparkles"
          iconColor={theme.colors.accent.ai}
          theme={theme}
        >
          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: getConfidenceColor(aiInsights.confidence) + '20' }]}>
              <Ionicons name="analytics" size={18} color={getConfidenceColor(aiInsights.confidence)} />
            </View>
            <View style={styles.insightText}>
              <Text variant="body" style={{ fontWeight: '600' }}>Recommendation Confidence</Text>
              <Text variant="caption" color="secondary">
                {aiInsights.confidence === 'high'
                  ? 'AI knows your taste very well'
                  : aiInsights.confidence === 'medium'
                    ? 'AI is learning your preferences'
                    : 'More swipes needed for accuracy'}
              </Text>
            </View>
            <View style={[styles.insightBadge, { backgroundColor: getConfidenceColor(aiInsights.confidence) }]}>
              <Text variant="caption" style={{ color: '#FFF', fontWeight: '700' }}>
                {aiInsights.confidence.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: theme.colors.accent.ai + '20' }]}>
              <Ionicons name="bulb" size={18} color={theme.colors.accent.ai} />
            </View>
            <View style={styles.insightText}>
              <Text variant="body" style={{ fontWeight: '600' }}>Predictability Score</Text>
              <Text variant="caption" color="secondary">
                {aiInsights.predictabilityScore > 70
                  ? 'Your taste is very consistent'
                  : aiInsights.predictabilityScore > 40
                    ? 'You have varied interests'
                    : 'You like to be surprised'}
              </Text>
            </View>
            <Text variant="h4" style={{ color: theme.colors.accent.ai }}>{aiInsights.predictabilityScore}%</Text>
          </View>

          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: theme.colors.accent.like + '20' }]}>
              <Ionicons name="compass" size={18} color={theme.colors.accent.like} />
            </View>
            <View style={styles.insightText}>
              <Text variant="body" style={{ fontWeight: '600' }}>Exploration Level</Text>
              <Text variant="caption" color="secondary">
                {aiInsights.explorationWillingness > 60
                  ? 'You love discovering new genres'
                  : aiInsights.explorationWillingness > 30
                    ? 'You occasionally try new things'
                    : 'You stick to what you know'}
              </Text>
            </View>
            <Text variant="h4" style={{ color: theme.colors.accent.like }}>{aiInsights.explorationWillingness}%</Text>
          </View>
        </SectionCard>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Section Card Component
function SectionCard({
  title,
  icon,
  iconColor,
  theme,
  children,
}: {
  title: string;
  icon: string;
  iconColor: string;
  theme: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={16} color={iconColor} />
        </View>
        <Text variant="h4" style={{ fontWeight: '600' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// Stat Item Component
function StatItem({
  label,
  value,
  theme,
  color,
}: {
  label: string;
  value: string;
  theme: any;
  color?: string;
}) {
  return (
    <View style={[styles.statItem, { backgroundColor: theme.colors.background.tertiary }]}>
      <Text variant="caption" color="secondary">{label}</Text>
      <Text variant="h3" style={{ color: color || theme.colors.text.primary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  loadingContainer: {
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  personalityCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personalityTitle: {
    color: '#FFF',
    fontWeight: '600',
  },
  moodProfile: {
    color: '#FFF',
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  personalityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personalityStat: {
    flex: 1,
    alignItems: 'center',
  },
  personalityStatLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  personalityStatValue: {
    color: '#FFF',
    fontWeight: '700',
  },
  personalityStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.sm,
  },
  sectionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statRowItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  genreRank: {
    width: 24,
    alignItems: 'center',
  },
  genreInfo: {
    flex: 1,
  },
  genreBarContainer: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  genreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  explorationScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  explorationInfo: {
    flex: 1,
  },
  patternGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  patternCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  prefGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  prefCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  subSectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  peakHoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  hourChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  peakDaysRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  decadeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  decadeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  timeOfDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  timeBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
  },
  insightBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
