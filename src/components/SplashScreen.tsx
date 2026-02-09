import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, typography } from '../theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const shimmerPosition = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Logo fade in and scale
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in and slide up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(800),
    ]).start(() => {
      onAnimationComplete?.();
    });

    // Shimmer animation loop
    Animated.loop(
      Animated.timing(shimmerPosition, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0505', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <SwipeWatchLogo />
      </Animated.View>

      {/* App Name */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Animated.Text style={styles.appName}>SwipeWatch</Animated.Text>
        <Animated.Text style={styles.tagline}>Find your next favorite</Animated.Text>
      </Animated.View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                transform: [
                  {
                    translateX: shimmerPosition.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-100, 100],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// Custom SVG Logo Component
function SwipeWatchLogo() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Defs>
        <SvgGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.primary[400]} />
          <Stop offset="100%" stopColor={colors.primary[600]} />
        </SvgGradient>
        <SvgGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F0F0F0" />
        </SvgGradient>
      </Defs>

      {/* Outer circle with swipe effect */}
      <Circle
        cx="60"
        cy="60"
        r="55"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="250 100"
      />

      {/* Inner filled circle */}
      <Circle cx="60" cy="60" r="45" fill="url(#logoGradient)" />

      {/* Play button triangle */}
      <Path
        d="M50 40 L50 80 L85 60 Z"
        fill="url(#playGradient)"
      />

      {/* Swipe arrow hint (right) */}
      <G opacity={0.8}>
        <Path
          d="M95 55 L105 60 L95 65"
          fill="none"
          stroke={colors.accent.like}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      {/* Swipe arrow hint (left) */}
      <G opacity={0.8}>
        <Path
          d="M25 55 L15 60 L25 65"
          fill="none"
          stroke={colors.accent.nope}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: colors.primary[500],
    opacity: 0.05,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -height * 0.15,
    left: -width * 0.25,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: colors.primary[500],
    opacity: 0.03,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    ...typography.sizes.h1,
    color: colors.dark.text.primary,
    marginBottom: 8,
  },
  tagline: {
    ...typography.sizes.body,
    color: colors.dark.text.secondary,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    width: 100,
    alignItems: 'center',
  },
  loadingBar: {
    width: 100,
    height: 3,
    backgroundColor: colors.dark.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: 50,
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
});
