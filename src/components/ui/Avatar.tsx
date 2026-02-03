import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { useTheme, borderRadius } from '../../theme';
import { Text } from './Text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: AvatarSize;
  showBorder?: boolean;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, 'captionSmall' | 'caption' | 'label' | 'body' | 'h3'> = {
  xs: 'captionSmall',
  sm: 'caption',
  md: 'label',
  lg: 'body',
  xl: 'h3',
};

export function Avatar({ source, name, size = 'md', showBorder = false }: AvatarProps) {
  const theme = useTheme();
  const dimension = sizeMap[size];

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: borderRadius.avatar,
          backgroundColor: theme.colors.background.tertiary,
          borderWidth: showBorder ? 2 : 0,
          borderColor: theme.colors.primary[500],
        },
      ]}
    >
      {source ? (
        <Image
          source={imageSource as ImageSourcePropType}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: borderRadius.avatar,
            },
          ]}
        />
      ) : name ? (
        <Text variant={fontSizeMap[size]} color="secondary" style={styles.initials}>
          {getInitials(name)}
        </Text>
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: theme.colors.background.elevated,
              borderRadius: borderRadius.avatar,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  placeholder: {
    width: '100%',
    height: '100%',
  },
});
