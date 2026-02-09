import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme, typography } from '../../theme';
import type { TextVariant } from '../../theme/typography';

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning' | 'accent';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface TextProps extends RNTextProps {
  /** Typography variant defining size, weight, and spacing */
  variant?: TextVariant;
  /** Text color from theme palette */
  color?: TextColor;
  /** Text alignment */
  align?: TextAlign;
  /** Override the default weight for this variant */
  weight?: TextWeight;
  /** Make text uppercase */
  uppercase?: boolean;
  /** Children content */
  children: React.ReactNode;
}

/**
 * Text component with design system typography
 *
 * Variants:
 * - display1, display2: Hero text, large titles
 * - h1, h2, h3, h4, h5: Section headings
 * - bodyLarge, body, bodySmall: Main content
 * - labelLarge, label, labelSmall: Form labels
 * - caption, captionSmall: Supporting text
 * - overline: Category labels (auto-uppercase)
 * - buttonLarge, button, buttonSmall: Button text
 * - numeric, numericLarge: Stats and ratings
 */
export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  uppercase,
  style,
  children,
  ...props
}: TextProps) {
  const theme = useTheme();
  const variantStyles = typography.sizes[variant];

  const colorMap: Record<TextColor, string> = {
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    tertiary: theme.colors.text.tertiary,
    inverse: theme.colors.text.inverse,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
    accent: theme.colors.primary[500],
  };

  const weightMap: Record<TextWeight, TextStyle['fontWeight']> = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  const textStyle: TextStyle = {
    ...variantStyles,
    color: colorMap[color],
    textAlign: align,
  };

  // Override weight if specified
  if (weight) {
    textStyle.fontWeight = weightMap[weight];
  }

  // Handle uppercase
  if (uppercase || (variantStyles as any).textTransform === 'uppercase') {
    textStyle.textTransform = 'uppercase';
  }

  return (
    <RNText
      style={[textStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Export for use in other components
export type { TextProps, TextVariant, TextColor, TextAlign, TextWeight };
