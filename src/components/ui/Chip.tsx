import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, borderRadius, spacing } from '../../theme';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onRemove?: () => void;
  disabled?: boolean;
}

export function Chip({
  label,
  selected = false,
  onPress,
  leftIcon,
  onRemove,
  disabled = false,
}: ChipProps) {
  const theme = useTheme();

  const getStyles = (pressed: boolean) => {
    if (selected) {
      return {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
        textColor: '#FFFFFF',
        iconColor: '#FFFFFF',
      };
    }
    return {
      backgroundColor: pressed
        ? theme.colors.background.tertiary
        : 'transparent',
      borderColor: theme.colors.border.default,
      textColor: theme.colors.text.primary,
      iconColor: theme.colors.text.secondary,
    };
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => {
        const styles = getStyles(pressed);
        return [
          chipStyles.container,
          {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            opacity: disabled ? 0.5 : 1,
          },
        ];
      }}
    >
      {({ pressed }) => {
        const currentStyles = getStyles(pressed);
        return (
          <>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={16}
                color={currentStyles.iconColor}
                style={chipStyles.leftIcon}
              />
            )}
            <Text
              variant="label"
              style={{ color: currentStyles.textColor }}
            >
              {label}
            </Text>
            {onRemove && (
              <Pressable onPress={onRemove} style={chipStyles.removeButton}>
                <Ionicons
                  name="close"
                  size={16}
                  color={currentStyles.iconColor}
                />
              </Pressable>
            )}
          </>
        );
      }}
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.chip,
    borderWidth: 1,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  removeButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
});
