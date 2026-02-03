import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Text } from '../ui';
import { colors, borderRadius, spacing } from '../../theme';

interface SwipeOverlayProps {
  translateX: Animated.SharedValue<number>;
  threshold: number;
}

export function SwipeOverlay({ translateX, threshold }: SwipeOverlayProps) {
  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, threshold],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const nopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-threshold, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <>
      {/* LIKE Overlay */}
      <Animated.View style={[styles.overlay, styles.likeOverlay, likeStyle]}>
        <View style={[styles.stamp, styles.likeStamp]}>
          <Text variant="h2" style={styles.likeText}>
            LIKE
          </Text>
        </View>
      </Animated.View>

      {/* NOPE Overlay */}
      <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeStyle]}>
        <View style={[styles.stamp, styles.nopeStamp]}>
          <Text variant="h2" style={styles.nopeText}>
            NOPE
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  likeOverlay: {
    alignItems: 'flex-start',
    paddingLeft: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  nopeOverlay: {
    alignItems: 'flex-end',
    paddingRight: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  stamp: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 4,
    borderRadius: borderRadius.md,
    transform: [{ rotate: '-20deg' }],
  },
  likeStamp: {
    borderColor: colors.accent.like,
  },
  nopeStamp: {
    borderColor: colors.accent.nope,
    transform: [{ rotate: '20deg' }],
  },
  likeText: {
    color: colors.accent.like,
    fontWeight: '800',
    letterSpacing: 2,
  },
  nopeText: {
    color: colors.accent.nope,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
