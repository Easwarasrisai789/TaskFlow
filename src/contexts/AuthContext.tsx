import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail, // ✅ added
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

/* =========================
   CONTEXT TYPE
========================= */
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  emailSignIn: (email: string, password: string) => Promise<void>;
  emailSignUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>; // ✅ added
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* =========================
   HOOK
========================= */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

/* =========================
   PROVIDER
========================= */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        await setDoc(
          userRef,
          {
            uid: firebaseUser.uid,
            name:
              firebaseUser.displayName ||
              firebaseUser.email?.split("@")[0],
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || null,
            lastLoginAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    });

    return () => unsub();
  }, []);

  const signInWithGoogleHandler = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const emailSignIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const emailSignUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    await createUserWithEmailAndPassword(auth, email, password);
    if (auth.currentUser && name) {
      await updateProfile(auth.currentUser, { displayName: name });
    }
    // Firestore profile is created by onAuthStateChanged
  };

  // ✅ FORGOT PASSWORD SUPPORT
  const resetPassword = async (email: string): Promise<void> => {
    if (!email) {
      throw new Error("Please enter your email address");
    }
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: signInWithGoogleHandler,
    emailSignIn,
    emailSignUp,
    resetPassword, // ✅ exposed
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
