import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useTheme, spacing, borderRadius } from '../../theme';

interface InviteCodeProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InviteCode({ code, size = 'lg' }: InviteCodeProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fontSize = size === 'lg' ? 36 : size === 'md' ? 28 : 20;
  const letterSpacing = size === 'lg' ? 12 : size === 'md' ? 8 : 4;
  const padding = size === 'lg' ? spacing.xl : size === 'md' ? spacing.lg : spacing.md;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleCopy}
        style={({ pressed }) => [
          styles.codeContainer,
          {
            backgroundColor: theme.colors.background.secondary,
            padding,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.code,
            {
              fontSize,
              letterSpacing,
              color: theme.colors.primary[500],
            },
          ]}
        >
          {code}
        </Text>
        <View style={[styles.copyIndicator, { backgroundColor: theme.colors.background.tertiary }]}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={16}
            color={copied ? theme.colors.success : theme.colors.text.secondary}
          />
          <Text variant="caption" color={copied ? 'primary' : 'secondary'}>
            {copied ? 'Copied!' : 'Tap to copy'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  codeContainer: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  code: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  copyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});
