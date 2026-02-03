import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Text, Badge } from '../ui';
import { SwipeOverlay } from './SwipeOverlay';
import { useTheme, spacing, borderRadius, shadows } from '../../theme';
import { getRatingColor } from '../../theme';
import { Media } from '../../types';
import { SwipeEngagement } from '../../types/recommendations';
import { getPosterUrl } from '../../services/tmdb';
import { GENRE_NAMES, SWIPE_THRESHOLD, SWIPE_VELOCITY_THRESHOLD, CARD_ROTATION_ANGLE } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

interface SwipeCardProps {
  media: Media;
  index: number;
  onSwipe: (direction: 'left' | 'right', engagement: SwipeEngagement) => void;
  onPress?: () => void;
  onCardExpanded?: () => void;  // Called when user taps to view details
  isTopCard: boolean;
}

export function SwipeCard({
  media,
  index,
  onSwipe,
  onPress,
  onCardExpanded,
  isTopCard,
}: SwipeCardProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Engagement tracking refs
  const cardViewStartTime = useRef<number>(Date.now());
  const cardExpanded = useRef<boolean>(false);
  const totalSwipeDistance = useRef<number>(0);

  // Reset tracking when card becomes top card
  useEffect(() => {
    if (isTopCard) {
      cardViewStartTime.current = Date.now();
      cardExpanded.current = false;
      totalSwipeDistance.current = 0;
    }
  }, [isTopCard]);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Create engagement data for the swipe
  const createEngagement = useCallback((velocity: number, distance: number): SwipeEngagement => {
    return {
      viewDurationMs: Date.now() - cardViewStartTime.current,
      swipeVelocity: Math.abs(velocity),
      swipeDistance: distance,
      cardExpanded: cardExpanded.current,
      trailerWatched: false, // Will be updated by detail screen
    };
  }, []);

  // Handle card press (expand for details)
  const handleCardPress = useCallback(() => {
    cardExpanded.current = true;
    onCardExpanded?.();
    onPress?.();
  }, [onPress, onCardExpanded]);

  // Track cumulative swipe distance
  const updateSwipeDistance = (x: number, y: number) => {
    totalSwipeDistance.current = Math.sqrt(x * x + y * y);
  };

  // Handle swipe completion with engagement data
  const handleSwipeComplete = (direction: 'left' | 'right', velocity: number) => {
    const engagement = createEngagement(velocity, totalSwipeDistance.current);
    onSwipe(direction, engagement);
  };

  const panGesture = Gesture.Pan()
    .enabled(isTopCard)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5; // Dampen vertical movement

      // Track total distance traveled
      runOnJS(updateSwipeDistance)(event.translationX, event.translationY);

      // Haptic feedback at threshold
      if (
        Math.abs(event.translationX) >= SWIPE_THRESHOLD &&
        Math.abs(event.translationX) < SWIPE_THRESHOLD + 10
      ) {
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        translateX.value > SWIPE_THRESHOLD || event.velocityX > SWIPE_VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD || event.velocityX < -SWIPE_VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, {
          velocity: event.velocityX,
          damping: 20,
        });
        runOnJS(handleSwipeComplete)('right', event.velocityX);
      } else if (shouldSwipeLeft) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {
          velocity: event.velocityX,
          damping: 20,
        });
        runOnJS(handleSwipeComplete)('left', event.velocityX);
      } else {
        // Spring back to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-CARD_ROTATION_ANGLE, 0, CARD_ROTATION_ANGLE],
      Extrapolation.CLAMP
    );

    // Stack effect
    const scale = interpolate(index, [0, 1, 2], [1, 0.95, 0.9]);
    const translateYStack = interpolate(index, [0, 1, 2], [0, 10, 20]);

    return {
      transform: [
        { translateX: isTopCard ? translateX.value : 0 },
        { translateY: isTopCard ? translateY.value + translateYStack : translateYStack },
        { rotate: isTopCard ? `${rotate}deg` : '0deg' },
        { scale: isTopCard ? 1 : scale },
      ],
      zIndex: 3 - index,
    };
  });

  const posterUrl = getPosterUrl(media.posterPath, 'large');
  const genres = media.genreIds
    .slice(0, 2)
    .map((id) => GENRE_NAMES[id])
    .filter(Boolean);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Pressable onPress={handleCardPress} style={styles.pressable}>
          {/* Poster Image */}
          <Image
            source={{ uri: posterUrl || undefined }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
          />

          {/* Swipe Overlays */}
          {isTopCard && <SwipeOverlay translateX={translateX} threshold={SWIPE_THRESHOLD} />}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            locations={[0.4, 0.7, 1]}
            style={styles.gradient}
          />

          {/* Content Info */}
          <View style={styles.content}>
            <Text variant="h2" numberOfLines={2} style={styles.title}>
              {media.title}
            </Text>

            <View style={styles.metaRow}>
              <Text variant="body" color="secondary">
                {media.releaseYear}
              </Text>
              {genres.length > 0 && (
                <>
                  <View style={styles.dot} />
                  <Text variant="body" color="secondary">
                    {genres.join(', ')}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Ionicons
                name="star"
                size={16}
                color={getRatingColor(media.rating)}
              />
              <Text
                variant="body"
                style={[styles.rating, { color: getRatingColor(media.rating) }]}
              >
                {media.rating.toFixed(1)}
              </Text>
              <Text variant="bodySmall" color="tertiary">
                ({media.voteCount.toLocaleString()} votes)
              </Text>
            </View>

            {/* Tap for more info hint */}
            <View style={styles.expandHint}>
              <Ionicons name="chevron-up" size={20} color={theme.colors.text.secondary} />
              <Text variant="caption" color="secondary">
                Tap for details
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    ...shadows.xl,
  },
  pressable: {
    flex: 1,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888',
    marginHorizontal: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  rating: {
    fontWeight: '700',
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
