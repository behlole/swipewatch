import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, borderRadius, spacing } from '../../theme';
import { Text } from './Text';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[500],
          textColor: '#FFFFFF',
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          textColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          textColor: '#000000',
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          textColor: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: theme.colors.background.tertiary,
          textColor: theme.colors.text.secondary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          minWidth: 18,
        };
      case 'md':
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          minWidth: 24,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          ...sizeStyles,
        },
      ]}
    >
      <Text
        variant={size === 'sm' ? 'labelSmall' : 'label'}
        style={{ color: variantStyles.textColor }}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
