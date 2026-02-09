import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { useTheme, borderRadius, colors } from '../../theme';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

interface AvatarProps {
  /** Image source (URL string or require()) */
  source?: ImageSourcePropType | string;
  /** Name for generating initials */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Show colored border */
  showBorder?: boolean;
  /** Border color override */
  borderColor?: string;
  /** Online status indicator */
  status?: AvatarStatus;
  /** Show as premium user with glow */
  isPremium?: boolean;
  /** Fallback icon when no image or name */
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 120,
};

const fontSizeMap: Record<AvatarSize, 'captionSmall' | 'caption' | 'label' | 'body' | 'h3' | 'h1'> = {
  xs: 'captionSmall',
  sm: 'caption',
  md: 'label',
  lg: 'body',
  xl: 'h3',
  '2xl': 'h1',
};

const statusSizeMap: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
};

const statusColorMap: Record<AvatarStatus, string> = {
  online: colors.success,
  offline: colors.dark.text.tertiary,
  away: colors.warning,
  busy: colors.error,
};

/**
 * Avatar component for user profile images
 *
 * Features:
 * - Multiple sizes from xs to 2xl
 * - Auto-generated initials from name
 * - Status indicator (online/offline/away/busy)
 * - Premium user glow effect
 * - Fallback icon support
 */
export function Avatar({
  source,
  name,
  size = 'md',
  showBorder = false,
  borderColor,
  status,
  isPremium = false,
  fallbackIcon = 'person',
}: AvatarProps) {
  const theme = useTheme();
  const dimension = sizeMap[size];
  const statusSize = statusSizeMap[size];

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate a consistent color from name for initials background
  const getInitialsColor = (name: string) => {
    const colorOptions = [
      colors.primary[500],
      colors.accent.like,
      colors.accent.watchlist,
      colors.accent.ai,
      colors.warning,
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorOptions[index % colorOptions.length];
  };

  const imageSource = typeof source === 'string' ? { uri: source } : source;
  const initialsColor = name ? getInitialsColor(name) : colors.dark.background.tertiary;

  const premiumGlow = isPremium
    ? {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      }
    : {};

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            width: dimension,
            height: dimension,
            borderRadius: borderRadius.avatar,
            backgroundColor: source ? theme.colors.background.tertiary : initialsColor + '20',
            borderWidth: showBorder ? 2 : 0,
            borderColor: borderColor || theme.colors.primary[500],
          },
          premiumGlow,
        ]}
      >
        {source ? (
          <Image
            source={imageSource as ImageSourcePropType}
            style={[
              styles.image,
              {
                width: dimension - (showBorder ? 4 : 0),
                height: dimension - (showBorder ? 4 : 0),
                borderRadius: borderRadius.avatar,
              },
            ]}
          />
        ) : name ? (
          <Text
            variant={fontSizeMap[size]}
            style={[styles.initials, { color: initialsColor }]}
          >
            {getInitials(name)}
          </Text>
        ) : (
          <Ionicons
            name={fallbackIcon}
            size={dimension * 0.5}
            color={theme.colors.text.tertiary}
          />
        )}
      </View>

      {/* Status indicator */}
      {status && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: statusColorMap[status],
              borderWidth: 2,
              borderColor: theme.colors.background.primary,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
  },
});
