import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, Button, Input } from '../../src/components/ui';
import { useTheme, spacing } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { signUpSchema, SignUpFormData } from '../../src/lib/validation';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp(data.email, data.password, data.displayName);
      // Navigation is handled automatically by _layout.tsx based on auth state
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </Pressable>
            <Text variant="h1">Create account</Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Start discovering your next favorite movie
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
              name="displayName"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                  autoComplete="name"
                  leftIcon="person-outline"
                />
              )}
            />

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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry
                  autoComplete="new-password"
                  leftIcon="lock-closed-outline"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                  autoComplete="new-password"
                  leftIcon="lock-closed-outline"
                />
              )}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            >
              Create Account
            </Button>

            <Text variant="caption" color="tertiary" align="center" style={styles.terms}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" color="secondary">
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-in')}>
              <Text variant="bodySmall" style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPadding,
    flexGrow: 1,
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
  terms: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: spacing.lg,
  },
});
