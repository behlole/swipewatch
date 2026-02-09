import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePreferencesStore } from '../../../stores/preferencesStore';
import { useWatchlistStore } from '../../watchlist/stores/watchlistStore';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword,
  onAuthStateChange,
  getUserDocument,
  updateOnboardingComplete,
  checkHasTasteProfile,
} from '../../../services/firebase';

export function useAuth() {
  const {
    firebaseUser,
    user,
    isLoading,
    isAuthenticated,
    hasCompletedOnboarding,
    isNewSignup,
    setFirebaseUser,
    setUser,
    setLoading,
    setHasCompletedOnboarding,
    setIsNewSignup,
    signOut: storeSignOut,
  } = useAuthStore();

  // Also get preferences store to keep hasCompletedOnboarding in sync
  const { setHasCompletedOnboarding: setPreferencesOnboarding } = usePreferencesStore();

  // Get watchlist store for Firebase sync
  const { syncFromFirebase: syncWatchlist, clearAll: clearWatchlist } = useWatchlistStore();

  // Track if this is the initial auth check (persists across re-renders)
  const isInitialCheckRef = useRef(true);

  // Initialize auth state listener
  useEffect(() => {
    let isMounted = true;

    // Set a short timeout to prevent infinite loading if Firebase isn't responding
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log('[Auth] Timeout - setting loading to false');
        setLoading(false);
      }
    }, 3000);

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChange(async (authUser) => {
        if (!isMounted) return;
        clearTimeout(timeout);

        console.log('[Auth] onAuthStateChange fired:', authUser ? `User: ${authUser.uid}` : 'No user', 'isInitialCheck:', isInitialCheckRef.current);

        if (authUser) {
          // User is authenticated
          setFirebaseUser(authUser);

          try {
            // Fetch user document with a timeout
            const userDocPromise = getUserDocument(authUser.uid);
            const timeoutPromise = new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 3000)
            );

            const userDoc = await Promise.race([userDocPromise, timeoutPromise]);

            if (isMounted) {
              setUser(userDoc);

              // Check if user has completed onboarding from Firebase
              // For existing users without the field, assume completed (they used app before this feature)
              let hasCompleted = userDoc?.hasCompletedOnboarding === true ||
                (userDoc && userDoc.hasCompletedOnboarding === undefined);

              // If not marked complete, check for existing taste data
              if (!hasCompleted) {
                const hasTasteData = await checkHasTasteProfile(authUser.uid);
                if (hasTasteData) {
                  console.log('[Auth] User has existing taste data, marking onboarding complete');
                  hasCompleted = true;
                  // Update Firebase in background
                  updateOnboardingComplete(authUser.uid).catch((err) =>
                    console.warn('[Auth] Failed to update onboarding status:', err)
                  );
                }
              }

              if (hasCompleted) {
                setHasCompletedOnboarding(true);
                setPreferencesOnboarding(true); // Keep preferences store in sync
                setIsNewSignup(false); // Not a new signup if already completed onboarding
              }

              // Sync watchlist from Firebase (non-blocking)
              syncWatchlist(authUser.uid).catch((err) =>
                console.warn('[Auth] Failed to sync watchlist:', err)
              );
            }
          } catch (error) {
            console.error('[Auth] Error fetching user document:', error);
            if (isMounted) {
              setUser(null);
            }
          }
        } else {
          // No user - but only reset auth state if this is NOT the initial check
          // This prevents overwriting authenticated state when Firebase session isn't persisted
          // The actual sign-out will explicitly call storeSignOut()
          if (!isInitialCheckRef.current) {
            console.log('[Auth] User signed out, clearing state');
            setFirebaseUser(null);
          } else {
            console.log('[Auth] Initial check with no user, just setting loading false');
          }
          setUser(null);
        }

        isInitialCheckRef.current = false;

        if (isMounted) {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('[Auth] Error setting up auth listener:', error);
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setFirebaseUser, setUser, setLoading, setHasCompletedOnboarding, setPreferencesOnboarding, setIsNewSignup, syncWatchlist]);

  // Sign up
  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      console.log('[useAuth] Calling signUpWithEmail...');
      const result = await signUpWithEmail(email, password, displayName);
      console.log('[useAuth] signUpWithEmail returned:', result?.uid);

      // Immediately set authenticated state after successful sign-up
      if (result) {
        console.log('[useAuth] Setting authenticated state immediately');
        setFirebaseUser(result);
        setIsNewSignup(true); // Mark as new signup for taste onboarding
      }

      return result;
    },
    [setFirebaseUser, setIsNewSignup]
  );

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[useAuth] Calling signInWithEmail...');
    const result = await signInWithEmail(email, password);
    console.log('[useAuth] signInWithEmail returned:', result?.uid);

    // Immediately set authenticated state after successful sign-in
    // Don't wait for onAuthStateChanged which may have timing issues
    if (result) {
      console.log('[useAuth] Setting authenticated state immediately');

      // Fetch user document to check onboarding status BEFORE setting auth state
      try {
        const userDoc = await getUserDocument(result.uid);
        // Check if user has completed onboarding
        // For existing users without the field, assume completed (they used app before this feature)
        let hasCompleted = userDoc?.hasCompletedOnboarding === true ||
          (userDoc && userDoc.hasCompletedOnboarding === undefined);

        // Even if onboarding not marked complete, check if user has taste data
        // This allows users who have swiped to skip onboarding
        if (!hasCompleted) {
          console.log('[useAuth] Checking for existing taste profile data...');
          const hasTasteData = await checkHasTasteProfile(result.uid);
          if (hasTasteData) {
            console.log('[useAuth] User has existing taste data, skipping onboarding');
            hasCompleted = true;
            // Update Firebase in background
            updateOnboardingComplete(result.uid).catch((err) =>
              console.warn('[useAuth] Failed to update onboarding status:', err)
            );
          }
        }

        if (hasCompleted) {
          console.log('[useAuth] User has completed onboarding');
          setHasCompletedOnboarding(true);
          setPreferencesOnboarding(true);
        }
        setUser(userDoc);
      } catch (error) {
        console.warn('[useAuth] Failed to fetch user document on sign in:', error);
      }

      setFirebaseUser(result);
    }

    return result;
  }, [setFirebaseUser, setHasCompletedOnboarding, setPreferencesOnboarding, setUser]);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut();
      storeSignOut();
      clearWatchlist(); // Clear local watchlist on sign out
    } finally {
      setLoading(false);
    }
  }, [setLoading, storeSignOut, clearWatchlist]);

  // Forgot password
  const forgotPassword = useCallback(async (email: string) => {
    await resetPassword(email);
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async (idToken: string) => {
    console.log('[useAuth] Calling signInWithGoogle...');
    const { user: result, isNewUser } = await firebaseSignInWithGoogle(idToken);
    console.log('[useAuth] signInWithGoogle returned:', result?.uid, 'isNewUser:', isNewUser);

    if (result) {
      console.log('[useAuth] Setting authenticated state immediately');

      if (isNewUser) {
        // New user - check if they have taste data (from previous session/device)
        const hasTasteData = await checkHasTasteProfile(result.uid);
        if (hasTasteData) {
          console.log('[useAuth] New Google user has existing taste data, skipping onboarding');
          setHasCompletedOnboarding(true);
          setPreferencesOnboarding(true);
          // Update Firebase in background
          updateOnboardingComplete(result.uid).catch((err) =>
            console.warn('[useAuth] Failed to update onboarding status:', err)
          );
        } else {
          // Truly new user - needs onboarding
          setIsNewSignup(true);
          setHasCompletedOnboarding(false);
        }
      } else {
        // Existing user - fetch user document
        try {
          const userDoc = await getUserDocument(result.uid);
          let hasCompleted = userDoc?.hasCompletedOnboarding === true ||
            (userDoc && userDoc.hasCompletedOnboarding === undefined);

          // Check for existing taste data
          if (!hasCompleted) {
            const hasTasteData = await checkHasTasteProfile(result.uid);
            if (hasTasteData) {
              console.log('[useAuth] Google user has existing taste data, skipping onboarding');
              hasCompleted = true;
              // Update Firebase in background
              updateOnboardingComplete(result.uid).catch((err) =>
                console.warn('[useAuth] Failed to update onboarding status:', err)
              );
            }
          }

          if (hasCompleted) {
            console.log('[useAuth] User has completed onboarding');
            setHasCompletedOnboarding(true);
            setPreferencesOnboarding(true);
          }
          setUser(userDoc);
        } catch (error) {
          console.warn('[useAuth] Failed to fetch user document on Google sign in:', error);
        }
      }

      setFirebaseUser(result);
    }

    return result;
  }, [setFirebaseUser, setIsNewSignup, setHasCompletedOnboarding, setPreferencesOnboarding, setUser]);

  // Complete onboarding - updates local state immediately, then saves to Firebase
  const completeOnboarding = useCallback(async () => {
    // Set local state FIRST so routing works immediately
    setHasCompletedOnboarding(true);
    setPreferencesOnboarding(true);
    setIsNewSignup(false);

    // Then save to Firebase in background (non-blocking)
    if (firebaseUser?.uid) {
      try {
        await updateOnboardingComplete(firebaseUser.uid);
        console.log('[Auth] Onboarding completion saved to Firebase');
      } catch (error) {
        console.warn('[Auth] Failed to save onboarding completion to Firebase:', error);
        // Local state is already set, so user can continue
      }
    }
  }, [firebaseUser?.uid, setHasCompletedOnboarding, setPreferencesOnboarding, setIsNewSignup]);

  return {
    // State
    firebaseUser,
    user,
    isLoading,
    isAuthenticated,
    hasCompletedOnboarding,
    isNewSignup,

    // Actions
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    forgotPassword,
    completeOnboarding,
    setHasCompletedOnboarding,
    setIsNewSignup,
  };
}
