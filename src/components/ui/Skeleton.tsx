import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme, borderRadius } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerProgress.value,
      [0, 0.5, 1],
      [0.3, 0.6, 0.3]
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.background.tertiary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={200} borderRadius={borderRadius.card} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={20} />
        <Skeleton width="60%" height={16} style={styles.mt8} />
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={56} height={56} borderRadius={borderRadius.md} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="50%" height={14} style={styles.mt8} />
      </View>
    </View>
  );
}

export function SkeletonPoster() {
  return (
    <View>
      <Skeleton width={140} height={210} borderRadius={borderRadius.card} />
      <Skeleton width={120} height={14} style={styles.mt8} />
      <Skeleton width={80} height={12} style={styles.mt4} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    width: '100%',
  },
  cardContent: {
    paddingTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  mt4: {
    marginTop: 4,
  },
  mt8: {
    marginTop: 8,
  },
});
