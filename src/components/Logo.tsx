import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon';
}

export function Logo({ size = 80, variant = 'icon' }: LogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary[400]} />
            <Stop offset="100%" stopColor={colors.primary[600]} />
          </LinearGradient>
          <LinearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F0F0F0" />
          </LinearGradient>
        </Defs>

        {/* Outer circle with swipe effect */}
        <Circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="url(#logoGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="250 100"
        />

        {/* Inner filled circle */}
        <Circle cx="60" cy="60" r="45" fill="url(#logoGrad)" />

        {/* Play button triangle */}
        <Path
          d="M50 40 L50 80 L85 60 Z"
          fill="url(#playGrad)"
        />

        {/* Swipe arrow hint (right) - like/green */}
        <G opacity={0.9}>
          <Path
            d="M95 55 L105 60 L95 65"
            fill="none"
            stroke={colors.accent.like}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>

        {/* Swipe arrow hint (left) - nope/red */}
        <G opacity={0.9}>
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
    </View>
  );
}

// Simplified version for small sizes
export function LogoSimple({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="logoGradSimple" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.primary[400]} />
          <Stop offset="100%" stopColor={colors.primary[600]} />
        </LinearGradient>
      </Defs>

      {/* Circle background */}
      <Circle cx="60" cy="60" r="55" fill="url(#logoGradSimple)" />

      {/* Play button */}
      <Path
        d="M48 35 L48 85 L92 60 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
