import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../../../types';

interface AuthState {
  // State
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isNewSignup: boolean; // True when user just signed up (not login)

  // Actions
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setIsNewSignup: (isNew: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      firebaseUser: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isNewSignup: false,

      // Actions
      setFirebaseUser: (firebaseUser) => {
        console.log('[AuthStore] setFirebaseUser:', firebaseUser ? `User: ${firebaseUser.uid}` : 'null');
        console.log('[AuthStore] Setting isAuthenticated to:', !!firebaseUser);
        set({
          firebaseUser,
          isAuthenticated: !!firebaseUser,
          isLoading: false,
        });
      },

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      setHasCompletedOnboarding: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),

      setIsNewSignup: (isNewSignup) => set({ isNewSignup }),

      signOut: () =>
        set({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          isNewSignup: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
