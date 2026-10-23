import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { recordVisitSession } from '../services/visitorService';

const ADMIN_EMAIL = 'kfmughal79@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminEmail: boolean;
  isEmailVerified: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAdminEmail: false,
  isEmailVerified: false,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  authError: null,
  clearAuthError: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setAuthError(null);
        await recordVisitSession();
      }
    });

    return () => unsubscribe();
  }, []);

  const isAdminEmail = !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isEmailVerified = !!user && user.emailVerified === true;
  const isAdmin = isAdminEmail && isEmailVerified;

  const clearAuthError = () => setAuthError(null);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign in error:', err);
      const code = err?.code || '';
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';

      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `UNAUTHORIZED_DOMAIN:${domain}`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site and click Sign In again.');
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('The sign-in window was closed before completing login. Please try again.');
      } else {
        setAuthError(err?.message || 'Failed to sign in with Google. Please check your internet connection.');
      }
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isAdminEmail,
        isEmailVerified,
        signInWithGoogle,
        signOutUser,
        authError,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
