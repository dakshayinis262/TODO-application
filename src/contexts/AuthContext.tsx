import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleAuthProvider } from '../lib/firebase';
import { api } from '../lib/api';
import type { UserProfile } from '../types/task';
import { useTheme } from './ThemeContext';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completePasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  updateUserDisplayName: (displayName: string) => Promise<void>;
  syncThemePreference: (theme: 'light' | 'dark') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and retry.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled for this project yet. Please use Continue with Google.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This password reset link is invalid or has expired.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userProfile = await api.getProfile();
          setProfile(userProfile);
          if (userProfile.themePreference === 'dark' || userProfile.themePreference === 'light') {
            setTheme(userProfile.themePreference);
          }
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setTheme]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      toast.success('Signed in to TaskFlow');
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back');
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName?.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      toast.success('Account created');
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset instructions sent to your email');
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const completePasswordReset = async (oobCode: string, newPassword: string) => {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password updated. You can now sign in.');
    } catch (err) {
      const msg = mapFirebaseAuthError(err);
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const updateUserDisplayName = async (displayName: string) => {
    const updated = await api.updateProfile({ displayName: displayName.trim() || null });
    setProfile(updated);
    if (auth.currentUser && displayName.trim()) {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() }).catch(() => {});
    }
    toast.success('Profile updated');
  };

  const syncThemePreference = async (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    if (user) {
      try {
        const updated = await api.updateProfile({ themePreference: nextTheme });
        setProfile(updated);
      } catch {
        // local preference already applied
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    toast.success('Signed out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        requestPasswordReset,
        completePasswordReset,
        updateUserDisplayName,
        syncThemePreference,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
