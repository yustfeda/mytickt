import React, { createContext, useState, useEffect, useContext } from 'react';
// Fix: The project seems to be using Firebase v8 SDK.
// The code has been refactored from v9 modular syntax to v8 namespaced syntax to fix import errors.
// Fix: Use Firebase v9 compatibility imports for v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import type { User } from '../types';
import { getUser, createUser, updateUser } from '../services/firebase';
import { auth } from '../services/firebase';

type FirebaseUser = firebase.User;


interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  register: (email: string, password: string, nickname: string) => Promise<{ success: boolean; message: string; }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setLoading(true);
        const appUser = await getUser(fbUser.uid);
        if (appUser) {
          setUser(appUser);
          // Update last login
          await updateUser(fbUser.uid, { lastLogin: new Date().toISOString() });
        } else {
            // This might happen if user exists in Auth but not in DB (e.g., failed registration)
            // For admins, this is a problem. For users, we might create a DB entry.
            // For now, we log them out of the app context.
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, nickname: string): Promise<{ success: boolean; message: string; }> => {
    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        throw new Error("User creation failed.");
      }
      const newUser = await createUser(userCredential.user.uid, email, nickname);
      setUser(newUser);
      return { success: true, message: "Registrasi berhasil!" };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; }> => {
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle setting the user
      return { success: true, message: "Login berhasil!" };
    } catch (error: any) {
      return { success: false, message: "Email atau password salah." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};