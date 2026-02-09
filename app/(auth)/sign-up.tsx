import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button, Input } from '../../src/components/ui';
import { LogoSimple } from '../../src/components/Logo';
import { spacing, colors } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { signUpSchema, SignUpFormData } from '../../src/lib/validation';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
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
      console.log('[SignUp] Starting sign up...');
      await signUp(data.email, data.password, data.displayName);
      console.log('[SignUp] Sign up completed successfully');
    } catch (err: any) {
      console.log('[SignUp] Sign up failed:', err.code, err.message);
      const message = getFirebaseErrorMessage(err.code);
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#1A0505', '#0D0D0D', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      <View style={styles.decorativeCircle} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <View style={styles.backButtonCircle}>
                  <Ionicons name="arrow-back" size={20} color={colors.dark.text.primary} />
                </View>
              </Pressable>

              <View style={styles.logoContainer}>
                <LogoSimple size={48} />
              </View>

              <Text variant="h2" style={styles.title}>Create account</Text>
              <Text variant="bodyLarge" color="secondary" style={styles.subtitle}>
                Start discovering your next favorite movie
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text variant="bodySmall" color="error" style={styles.errorText}>
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
                style={styles.submitButton}
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
                <Text variant="label" style={styles.linkText}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
    backgroundColor: colors.dark.background.primary,
  },
  decorativeCircle: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: colors.primary[500],
    opacity: 0.06,
  },
  safeArea: {
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
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border.subtle,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.accent.nopeBg,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    flex: 1,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  submitButton: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  terms: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: spacing.xl,
  },
  linkText: {
    color: colors.primary[500],
  },
});
