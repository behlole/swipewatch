import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import { BannerSize } from '../types';
import { BANNER_HEIGHTS } from '../constants';

interface AdPlaceholderProps {
  size?: BannerSize;
  width?: number;
  height?: number;
}

export function AdPlaceholder({ size = 'banner', width, height }: AdPlaceholderProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const placeholderHeight = height || BANNER_HEIGHTS[size];
  const placeholderWidth = width || '100%';

  return (
    <View style={[styles.container, { width: placeholderWidth as number | `${number}%` }]}>
      <Animated.View
        style={[
          styles.placeholder,
          animatedStyle,
          {
            height: placeholderHeight,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
  },
});
