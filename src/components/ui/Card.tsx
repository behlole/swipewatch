import React from 'react';
import { View, ViewProps, StyleSheet, Pressable, PressableProps, ViewStyle } from 'react-native';
import { useTheme, borderRadius, spacing, shadows } from '../../theme';

interface CardProps extends ViewProps {
  /** Card visual style variant */
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  /** Padding size or custom number */
  padding?: keyof typeof spacing | number;
  /** Optional glow color for special cards */
  glowColor?: string;
}

interface PressableCardProps extends PressableProps {
  /** Card visual style variant */
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  /** Padding size or custom number */
  padding?: keyof typeof spacing | number;
  /** Optional glow color for special cards */
  glowColor?: string;
  children: React.ReactNode;
}

/**
 * Card component for containing content with consistent styling
 *
 * Variants:
 * - elevated: Raised with shadow (default)
 * - outlined: Border with transparent background
 * - filled: Solid background without shadow
 * - glass: Semi-transparent with blur effect
 */
export function Card({
  variant = 'elevated',
  padding = 'lg',
  glowColor,
  style,
  children,
  ...props
}: CardProps) {
  const theme = useTheme();

  const getPadding = () => {
    if (typeof padding === 'number') return padding;
    return spacing[padding];
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.border.default,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.background.tertiary,
          borderWidth: 0,
        };
      case 'glass':
        return {
          backgroundColor: theme.colors.background.secondary + 'CC', // 80% opacity
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          ...shadows.sm,
        };
    }
  };

  const glowStyle = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }
    : {};

  return (
    <View
      style={[
        styles.base,
        { padding: getPadding() },
        getVariantStyles(),
        glowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * Pressable Card component for interactive card elements
 */
export function PressableCard({
  variant = 'elevated',
  padding = 'lg',
  glowColor,
  style,
  children,
  disabled,
  ...props
}: PressableCardProps) {
  const theme = useTheme();

  const getPadding = () => {
    if (typeof padding === 'number') return padding;
    return spacing[padding];
  };

  const getVariantStyles = (pressed: boolean) => {
    const pressedAlpha = pressed ? 0.9 : 1;

    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: pressed
            ? theme.colors.background.tertiary
            : theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: pressed
            ? theme.colors.border.default
            : theme.colors.border.subtle,
          ...(pressed ? shadows.sm : shadows.md),
          opacity: disabled ? 0.5 : pressedAlpha,
        };
      case 'outlined':
        return {
          backgroundColor: pressed
            ? theme.colors.background.secondary
            : 'transparent',
          borderWidth: 1.5,
          borderColor: pressed
            ? theme.colors.border.strong
            : theme.colors.border.default,
          opacity: disabled ? 0.5 : pressedAlpha,
        };
      case 'filled':
        return {
          backgroundColor: pressed
            ? theme.colors.background.elevated
            : theme.colors.background.tertiary,
          borderWidth: 0,
          opacity: disabled ? 0.5 : pressedAlpha,
        };
      case 'glass':
        return {
          backgroundColor: pressed
            ? theme.colors.background.tertiary + 'CC'
            : theme.colors.background.secondary + 'CC',
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          ...shadows.sm,
          opacity: disabled ? 0.5 : pressedAlpha,
        };
    }
  };

  const glowStyle = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }
    : {};

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { padding: getPadding() },
        getVariantStyles(pressed),
        glowStyle,
        typeof style === 'function' ? (style as any)({ pressed }) : style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
});
