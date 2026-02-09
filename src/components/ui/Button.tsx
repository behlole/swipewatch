import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme, borderRadius, spacing, typography } from '../../theme';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon on the left side */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Icon on the right side */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Button label */
  children: string;
}

/**
 * Button component with design system styling
 *
 * Variants:
 * - primary: Filled with brand color (default)
 * - secondary: Outlined with brand color
 * - ghost: Transparent with text
 * - danger: Filled with error color
 * - success: Filled with success color
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  // Size configuration with typography mapping
  const sizeConfig = {
    sm: {
      height: 40,
      paddingHorizontal: spacing.lg,
      iconSize: 16,
      iconGap: spacing.xs,
      typography: typography.sizes.buttonSmall,
    },
    md: {
      height: 52,
      paddingHorizontal: spacing.xl,
      iconSize: 20,
      iconGap: spacing.sm,
      typography: typography.sizes.button,
    },
    lg: {
      height: 60,
      paddingHorizontal: spacing['2xl'],
      iconSize: 22,
      iconGap: spacing.sm,
      typography: typography.sizes.buttonLarge,
    },
  };

  const getVariantStyles = (pressed: boolean): ViewStyle => {
    const baseOpacity = disabled ? 0.5 : pressed ? 0.85 : 1;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[pressed ? 600 : 500],
          borderWidth: 0,
          opacity: baseOpacity,
        };
      case 'secondary':
        return {
          backgroundColor: pressed ? theme.colors.primary[500] + '10' : 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.primary[500],
          opacity: baseOpacity,
        };
      case 'ghost':
        return {
          backgroundColor: pressed ? theme.colors.background.tertiary : 'transparent',
          borderWidth: 0,
          opacity: baseOpacity,
        };
      case 'danger':
        return {
          backgroundColor: pressed ? '#D03040' : theme.colors.error,
          borderWidth: 0,
          opacity: baseOpacity,
        };
      case 'success':
        return {
          backgroundColor: pressed ? '#00B85C' : theme.colors.success,
          borderWidth: 0,
          opacity: baseOpacity,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return '#FFFFFF';
      case 'secondary':
        return theme.colors.primary[500];
      case 'ghost':
        return theme.colors.text.primary;
    }
  };

  const currentSize = sizeConfig[size];
  const textColor = getTextColor();

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: borderRadius.lg,
        },
        getVariantStyles(pressed),
        fullWidth && styles.fullWidth,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={currentSize.iconSize}
              color={textColor}
              style={{ marginRight: currentSize.iconGap }}
            />
          )}
          <Text
            variant={size === 'sm' ? 'buttonSmall' : size === 'lg' ? 'buttonLarge' : 'button'}
            style={{ color: textColor }}
          >
            {children}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={currentSize.iconSize}
              color={textColor}
              style={{ marginLeft: currentSize.iconGap }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
