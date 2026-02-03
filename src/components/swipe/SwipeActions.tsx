import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../theme';

interface SwipeActionsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export function SwipeActions({
  onSwipeLeft,
  onSwipeRight,
  onUndo,
  canUndo = false,
  disabled = false,
}: SwipeActionsProps) {
  return (
    <View style={styles.container}>
      {/* Undo Button */}
      {onUndo && (
        <ActionButton
          icon="arrow-undo"
          size="small"
          color={colors.dark.text.secondary}
          backgroundColor={colors.dark.background.tertiary}
          onPress={onUndo}
          disabled={!canUndo || disabled}
        />
      )}

      {/* Nope Button */}
      <ActionButton
        icon="close"
        size="large"
        color="#FFFFFF"
        backgroundColor={colors.accent.nope}
        onPress={onSwipeLeft}
        disabled={disabled}
      />

      {/* Like Button */}
      <ActionButton
        icon="heart"
        size="large"
        color="#FFFFFF"
        backgroundColor={colors.accent.like}
        onPress={onSwipeRight}
        disabled={disabled}
      />
    </View>
  );
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size: 'small' | 'large';
  color: string;
  backgroundColor: string;
  onPress: () => void;
  disabled?: boolean;
}

function ActionButton({
  icon,
  size,
  color,
  backgroundColor,
  onPress,
  disabled = false,
}: ActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(
      size === 'large'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
    onPress();
  };

  const dimension = size === 'large' ? 64 : 48;
  const iconSize = size === 'large' ? 32 : 20;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.button,
          {
            width: dimension,
            height: dimension,
            backgroundColor,
            opacity: disabled ? 0.5 : 1,
          },
          shadows.md,
          animatedStyle,
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={color} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  button: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
