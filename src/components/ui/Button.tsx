import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme, borderRadius, spacing } from '../../theme';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  children: string;
}

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

  const sizeStyles = {
    sm: { height: 36, paddingHorizontal: spacing.md, iconSize: 16 },
    md: { height: 48, paddingHorizontal: spacing.lg, iconSize: 20 },
    lg: { height: 56, paddingHorizontal: spacing.xl, iconSize: 24 },
  };

  const getVariantStyles = (pressed: boolean) => {
    const baseOpacity = disabled ? 0.5 : pressed ? 0.8 : 1;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[500],
          borderWidth: 0,
          opacity: baseOpacity,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
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
          backgroundColor: theme.colors.error,
          borderWidth: 0,
          opacity: baseOpacity,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return theme.colors.primary[500];
      case 'ghost':
        return theme.colors.text.primary;
    }
  };

  const currentSize = sizeStyles[size];
  const textColor = getTextColor();

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: borderRadius.button,
        },
        getVariantStyles(pressed),
        fullWidth && styles.fullWidth,
        style,
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
              style={styles.leftIcon}
            />
          )}
          <Text
            variant={size === 'sm' ? 'label' : 'body'}
            style={[styles.text, { color: textColor, fontWeight: '600' }]}
          >
            {children}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={currentSize.iconSize}
              color={textColor}
              style={styles.rightIcon}
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
  text: {
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});
