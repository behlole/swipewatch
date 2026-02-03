import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Text, Button, Input } from '../../src/components/ui';
import { useTheme, spacing } from '../../src/theme';
import { useAuth } from '../../src/features/auth/hooks/useAuth';
import { signInSchema, SignInFormData } from '../../src/lib/validation';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

// Required for web browser auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const theme = useTheme();
  const { signIn, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      console.log('[SignIn] Starting Google sign in...');
      await signInWithGoogle(idToken);
      console.log('[SignIn] Google sign in completed successfully');
      // Navigation is handled automatically by _layout.tsx based on auth state
    } catch (err: any) {
      console.log('[SignIn] Google sign in failed:', err.code, err.message);
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const onGooglePress = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      console.log('[SignIn] Google prompt failed:', err);
      setError('Could not start Google sign-in. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      console.log('[SignIn] Starting sign in...');
      await signIn(data.email, data.password);
      console.log('[SignIn] Sign in completed successfully');
      // Navigation is handled automatically by _layout.tsx based on auth state
    } catch (err: any) {
      console.log('[SignIn] Sign in failed:', err.code, err.message);
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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text variant="h1">Welcome back</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Sign in to continue
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="password"
                leftIcon="lock-closed-outline"
              />
            )}
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotPassword}
          >
            <Text variant="bodySmall" color="secondary">
              Forgot password?
            </Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            fullWidth
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
            <Text variant="caption" color="tertiary" style={styles.dividerText}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border.default }]} />
          </View>

          <Button
            variant="secondary"
            fullWidth
            leftIcon="logo-google"
            onPress={onGooglePress}
            loading={isGoogleLoading}
            disabled={!request || isSubmitting}
          >
            Continue with Google
          </Button>

          <Button
            variant="secondary"
            fullWidth
            leftIcon="logo-apple"
            onPress={() => Alert.alert('Coming Soon', 'Apple Sign-In will be available soon')}
          >
            Continue with Apple
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary">
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary[500], fontWeight: '600' }}>
              Sign up
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  actions: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: spacing.lg,
  },
});
