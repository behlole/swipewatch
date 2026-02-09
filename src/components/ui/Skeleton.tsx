import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, borderRadius, spacing, colors } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  /** Width of the skeleton (number or percentage string) */
  width?: number | `${number}%`;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Make it circular */
  circle?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * Skeleton loading placeholder with shimmer animation
 *
 * Use for content that is loading to show users where content will appear.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  circle = false,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const shimmerProgress = useSharedValue(0);

  const finalRadius = circle ? (typeof height === 'number' ? height / 2 : radius) : radius;
  const finalWidth = circle ? height : width;

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: finalWidth,
          height,
          borderRadius: finalRadius,
          backgroundColor: colors.dark.background.tertiary,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            colors.dark.background.elevated + '40',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Skeleton text line with natural text appearance
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lastLineWidth?: `${number}%`;
}) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={index > 0 ? styles.mt8 : undefined}
        />
      ))}
    </View>
  );
}

/**
 * Card skeleton with image and text
 */
export function SkeletonCard({ horizontal = false }: { horizontal?: boolean }) {
  if (horizontal) {
    return (
      <View style={styles.cardHorizontal}>
        <Skeleton width={100} height={150} borderRadius={borderRadius.card} />
        <View style={styles.cardHorizontalContent}>
          <Skeleton width="80%" height={18} />
          <Skeleton width="60%" height={14} style={styles.mt8} />
          <Skeleton width="40%" height={14} style={styles.mt8} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Skeleton height={200} borderRadius={borderRadius.card} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={18} />
        <Skeleton width="60%" height={14} style={styles.mt8} />
      </View>
    </View>
  );
}

/**
 * List item skeleton with avatar and text
 */
export function SkeletonListItem({
  avatarSize = 48,
  lines = 2,
}: {
  avatarSize?: number;
  lines?: number;
}) {
  return (
    <View style={styles.listItem}>
      <Skeleton width={avatarSize} height={avatarSize} circle />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        {lines >= 2 && <Skeleton width="50%" height={12} style={styles.mt8} />}
        {lines >= 3 && <Skeleton width="30%" height={12} style={styles.mt4} />}
      </View>
    </View>
  );
}

/**
 * Movie poster skeleton
 */
export function SkeletonPoster({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimensions = {
    sm: { width: 100, height: 150 },
    md: { width: 140, height: 210 },
    lg: { width: 180, height: 270 },
  };

  const { width, height } = dimensions[size];

  return (
    <View style={styles.poster}>
      <Skeleton width={width} height={height} borderRadius={borderRadius.card} />
      <Skeleton width={width - 20} height={14} style={styles.mt8} />
      <Skeleton width={width - 40} height={12} style={styles.mt4} />
    </View>
  );
}

/**
 * Movie row skeleton for horizontal scroll sections
 */
export function SkeletonMovieRow({
  title = true,
  count = 4,
}: {
  title?: boolean;
  count?: number;
}) {
  return (
    <View style={styles.movieRow}>
      {title && (
        <View style={styles.movieRowHeader}>
          <Skeleton width={150} height={20} />
          <Skeleton width={60} height={14} />
        </View>
      )}
      <View style={styles.movieRowContent}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonPoster key={index} size="md" />
        ))}
      </View>
    </View>
  );
}

/**
 * Profile header skeleton
 */
export function SkeletonProfileHeader() {
  return (
    <View style={styles.profileHeader}>
      <Skeleton width={100} height={100} circle />
      <View style={styles.profileHeaderContent}>
        <Skeleton width={150} height={24} style={styles.mt12} />
        <Skeleton width={200} height={14} style={styles.mt8} />
        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={12} style={styles.mt4} />
          </View>
          <View style={styles.profileStat}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={12} style={styles.mt4} />
          </View>
          <View style={styles.profileStat}>
            <Skeleton width={40} height={24} />
            <Skeleton width={60} height={12} style={styles.mt4} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    gap: spacing.sm,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    paddingTop: spacing.md,
  },
  cardHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardHorizontalContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingTop: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  poster: {
    marginRight: spacing.md,
  },
  movieRow: {
    marginBottom: spacing.xl,
  },
  movieRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  movieRowContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing['2xl'],
  },
  profileStat: {
    alignItems: 'center',
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
});
