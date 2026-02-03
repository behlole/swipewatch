import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged,
  Unsubscribe,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User, defaultUserPreferences, defaultUserStats } from '../../types';

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // Update profile with display name
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await createUserDocument(user);

  return user;
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  // Update last active timestamp
  await updateLastActive(user.uid);

  return user;
}

// Sign in with Google
export async function signInWithGoogle(idToken: string): Promise<{ user: FirebaseUser; isNewUser: boolean }> {
  // Create credential from Google ID token
  const credential = GoogleAuthProvider.credential(idToken);

  // Sign in with credential
  const { user } = await signInWithCredential(auth, credential);

  // Check if this is a new user
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const isNewUser = !userDoc.exists();

  if (isNewUser) {
    // Create user document for new users
    await createUserDocument(user);
  } else {
    // Update last active for existing users
    await updateLastActive(user.uid);
  }

  return { user, isNewUser };
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Password reset
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Create user document in Firestore
export async function createUserDocument(firebaseUser: FirebaseUser): Promise<void> {
  const userRef = doc(db, 'users', firebaseUser.uid);

  // Check if document already exists
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    return;
  }

  const userData: Omit<User, 'createdAt' | 'updatedAt' | 'lastActiveAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
    lastActiveAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'User',
    photoURL: firebaseUser.photoURL,
    providers: firebaseUser.providerData.map(p => p.providerId as 'email' | 'google.com' | 'apple.com'),
    preferences: defaultUserPreferences,
    stats: defaultUserStats,
    hasCompletedOnboarding: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  await setDoc(userRef, userData);
}

// Update onboarding completion status
export async function updateOnboardingComplete(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  // Use setDoc with merge to create document if it doesn't exist
  await setDoc(userRef, {
    hasCompletedOnboarding: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Update last active timestamp
export async function updateLastActive(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    // Don't fail sign-in if updating last active fails
    // User document might not exist yet for edge cases
    console.warn('Failed to update last active timestamp:', error);
  }
}

// Get user document
export async function getUserDocument(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  return userDoc.data() as User;
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<User['preferences']>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    preferences,
    updatedAt: serverTimestamp(),
  });
}

// Auth state listener
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
