import React from 'react';
import { View, ViewProps, StyleSheet, Pressable, PressableProps } from 'react-native';
import { useTheme, borderRadius, spacing, shadows } from '../../theme';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing | number;
}

interface PressableCardProps extends PressableProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof spacing | number;
  children: React.ReactNode;
}

export function Card({
  variant = 'elevated',
  padding = 'lg',
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
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border.default,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.background.tertiary,
        };
    }
  };

  return (
    <View
      style={[
        styles.base,
        { padding: getPadding() },
        getVariantStyles(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  variant = 'elevated',
  padding = 'lg',
  style,
  children,
  ...props
}: PressableCardProps) {
  const theme = useTheme();

  const getPadding = () => {
    if (typeof padding === 'number') return padding;
    return spacing[padding];
  };

  const getVariantStyles = (pressed: boolean) => {
    const baseStyles = {
      elevated: {
        backgroundColor: pressed
          ? theme.colors.background.tertiary
          : theme.colors.background.secondary,
        ...shadows.md,
      },
      outlined: {
        backgroundColor: pressed ? theme.colors.background.tertiary : 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border.default,
      },
      filled: {
        backgroundColor: pressed
          ? theme.colors.background.elevated
          : theme.colors.background.tertiary,
      },
    };
    return baseStyles[variant];
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { padding: getPadding() },
        getVariantStyles(pressed),
        typeof style === 'function' ? style({ pressed }) : style,
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
