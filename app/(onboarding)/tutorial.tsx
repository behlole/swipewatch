import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text, Button } from '../../src/components/ui';
import { useTheme, spacing, borderRadius, colors } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 4;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const SWIPE_THRESHOLD = 100;

const TUTORIAL_CARDS = [
  {
    title: 'Inception',
    year: 2010,
    rating: 8.8,
    genre: 'Sci-Fi',
    image: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
  },
  {
    title: 'The Dark Knight',
    year: 2008,
    rating: 9.0,
    genre: 'Action',
    image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  },
  {
    title: 'Interstellar',
    year: 2014,
    rating: 8.6,
    genre: 'Adventure',
    image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  },
];

const STEPS = [
  {
    title: 'Swipe Right',
    description: 'Like a movie and add it to your watchlist',
    icon: 'heart',
    color: colors.accent.like,
    direction: 'right',
  },
  {
    title: 'Swipe Left',
    description: "Not interested? Skip it and move on",
    icon: 'close',
    color: colors.accent.nope,
    direction: 'left',
  },
  {
    title: "You're Ready!",
    description: 'Start discovering movies and shows you\'ll love',
    icon: 'checkmark-circle',
    color: colors.primary[500],
    direction: null,
  },
];

export default function TutorialScreen() {
  const theme = useTheme();
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const currentCard = TUTORIAL_CARDS[cardIndex % TUTORIAL_CARDS.length];
  const step = STEPS[currentStep];

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => currentStep < 2,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        const expectedDirection = STEPS[currentStep]?.direction;

        if (gesture.dx > SWIPE_THRESHOLD && expectedDirection === 'right') {
          // Correct right swipe
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(pan, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setCardIndex((prev) => prev + 1);
            setCurrentStep((prev) => prev + 1);
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD && expectedDirection === 'left') {
          // Correct left swipe
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(pan, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setCardIndex((prev) => prev + 1);
            setCurrentStep((prev) => prev + 1);
          });
        } else {
          // Wrong direction or not enough distance
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const cardRotation = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleComplete = () => {
    // Complete onboarding - sets local state synchronously, Firebase in background
    completeOnboarding();
    // Small delay to let state propagate before navigation
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top', 'bottom']}
    >
      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  index <= currentStep
                    ? theme.colors.primary[500]
                    : theme.colors.background.tertiary,
              },
            ]}
          />
        ))}
      </View>

      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <View
          style={[
            styles.instructionIcon,
            { backgroundColor: step.color + '20' },
          ]}
        >
          <Ionicons name={step.icon as any} size={32} color={step.color} />
        </View>
        <Text variant="h2" align="center">
          {step.title}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {step.description}
        </Text>
      </View>

      {/* Card */}
      {currentStep < 2 ? (
        <View style={styles.cardContainer}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { rotate: cardRotation },
                ],
              },
            ]}
          >
            <Animated.Image
              source={{ uri: currentCard.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.cardGradient}
            />

            {/* LIKE Overlay */}
            <Animated.View
              style={[
                styles.overlay,
                styles.likeOverlay,
                { opacity: likeOpacity },
              ]}
            >
              <View style={[styles.overlayBadge, { borderColor: colors.accent.like }]}>
                <Text style={[styles.overlayText, { color: colors.accent.like }]}>
                  LIKE
                </Text>
              </View>
            </Animated.View>

            {/* NOPE Overlay */}
            <Animated.View
              style={[
                styles.overlay,
                styles.nopeOverlay,
                { opacity: nopeOpacity },
              ]}
            >
              <View style={[styles.overlayBadge, { borderColor: colors.accent.nope }]}>
                <Text style={[styles.overlayText, { color: colors.accent.nope }]}>
                  NOPE
                </Text>
              </View>
            </Animated.View>

            {/* Card Info */}
            <View style={styles.cardInfo}>
              <Text variant="h2" style={{ color: '#FFF' }}>
                {currentCard.title}
              </Text>
              <Text variant="body" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {currentCard.year} • {currentCard.genre}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text variant="body" style={{ color: '#FFD700' }}>
                  {currentCard.rating}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Hint Arrow */}
          <Animated.View
            style={[
              styles.hintArrow,
              step.direction === 'right' ? styles.hintRight : styles.hintLeft,
            ]}
          >
            <Ionicons
              name={step.direction === 'right' ? 'arrow-forward' : 'arrow-back'}
              size={32}
              color={step.color}
            />
          </Animated.View>
        </View>
      ) : (
        <View style={styles.completedContainer}>
          <View style={[styles.completedIcon, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="rocket" size={64} color={theme.colors.success} />
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {currentStep >= 2 ? (
          <Button onPress={handleComplete} leftIcon="play">
            Start Swiping
          </Button>
        ) : (
          <Text variant="caption" color="tertiary" align="center">
            {step.direction === 'right'
              ? 'Swipe the card to the right →'
              : 'Swipe the card to the left ←'}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  instructionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeOverlay: {
    backgroundColor: 'rgba(0, 210, 106, 0.2)',
  },
  nopeOverlay: {
    backgroundColor: 'rgba(255, 68, 88, 0.2)',
  },
  overlayBadge: {
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    transform: [{ rotate: '-20deg' }],
  },
  overlayText: {
    fontSize: 40,
    fontWeight: '800',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  hintArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
  },
  hintRight: {
    right: spacing.sm,
  },
  hintLeft: {
    left: spacing.sm,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
});
