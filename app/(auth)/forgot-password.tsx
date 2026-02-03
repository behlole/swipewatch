import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, Button, Input } from '../../src/components/ui';
import { useTheme, spacing } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../src/lib/validation';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Don't reveal if user exists or not for security
        setIsSuccess(true);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.successContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent.likeBg }]}>
            <Ionicons name="mail-outline" size={48} color={theme.colors.accent.like} />
          </View>
          <Text variant="h2" align="center">
            Check your email
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.successText}>
            We've sent password reset instructions to {getValues('email')}
          </Text>
          <Button fullWidth onPress={() => router.push('/(auth)/sign-in')}>
            Back to Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text variant="h1">Forgot password?</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.accent.nopeBg }]}>
              <Text variant="bodySmall" color="error">
                {error}
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Email"
                placeholder="your@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon="mail-outline"
              />
            )}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            fullWidth
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
          >
            Send Reset Link
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary">
            Remember your password?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  backButton: {
    marginBottom: spacing.lg,
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  actions: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: spacing.lg,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successText: {
    marginBottom: spacing.xl,
  },
});
