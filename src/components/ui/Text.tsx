import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme, typography } from '../../theme';

type TextVariant = keyof typeof typography.sizes;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const theme = useTheme();
  const variantStyles = typography.sizes[variant];

  const colorMap = {
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    tertiary: theme.colors.text.tertiary,
    inverse: theme.colors.text.inverse,
    error: theme.colors.error,
    success: theme.colors.success,
  };

  return (
    <RNText
      style={[
        variantStyles,
        { color: colorMap[color], textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
