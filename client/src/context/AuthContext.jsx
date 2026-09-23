import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword as fbCreateUser,
  signInWithEmailAndPassword as fbSignInWithEmail,
  signInWithPopup as fbSignInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from '../config/firebase';
import { deleteDoc, doc, getDocs, collection, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mitra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('mitra_token') || null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth State safely
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setFirebaseUser(fbUser);
      });
    } catch (err) {
      console.warn('Firebase Auth State listener notice:', err);
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const verifyStoredAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('mitra_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyStoredAuth();
  }, [token]);

  const login = async (identifier, password) => {
    try {
      let firebaseIdentifier = identifier.trim();
      if (!firebaseIdentifier.includes('@')) {
        try {
          const usernameQuery = await getDocs(query(collection(db, 'users'), where('username', '==', firebaseIdentifier.toLowerCase())));
          const profile = usernameQuery.docs[0]?.data();
          if (profile?.email) firebaseIdentifier = profile.email;
        } catch (firestoreError) {
          console.warn('Firebase username lookup notice:', firestoreError?.message);
        }
      }

      // 1. Authenticate with backend API
      const res = await api.post('/auth/login', { identifier, password });
      const { token: authToken, user: userData } = res.data;

      setToken(authToken);
      setUser(userData);

      localStorage.setItem('mitra_token', authToken);
      localStorage.setItem('mitra_user', JSON.stringify(userData));

      // 2. Safely attempt Firebase Email Auth without blocking API login
      if (firebaseIdentifier.includes('@')) {
        try {
          await fbSignInWithEmail(auth, firebaseIdentifier, password);
        } catch (fbErr) {
          console.log('Firebase auth sync notice:', fbErr?.code || fbErr?.message);
        }
      }

      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please verify credentials.';
      throw new Error(message);
    }
  };

  const register = async ({ name, username, email, password, team }) => {
    let firebaseUser = null;
    try {
      const result = await fbCreateUser(auth, email.trim(), password);
      firebaseUser = result.user;
      await updateProfile(firebaseUser, { displayName: name.trim() });

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        role: 'student',
        team,
        createdAt: serverTimestamp()
      });

      const res = await api.post('/auth/register', { name, username, email, password, team });
      const { token: authToken, user: userData } = res.data;
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('mitra_token', authToken);
      localStorage.setItem('mitra_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      if (firebaseUser) {
        try {
          await deleteDoc(doc(db, 'users', firebaseUser.uid));
          await deleteUser(firebaseUser);
        } catch (cleanupError) {
          console.warn('Registration cleanup notice:', cleanupError?.message);
        }
      }
      const codeMessages = {
        'auth/email-already-in-use': 'That email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Firebase requires a stronger password.'
      };
      const message = err.response?.data?.message || codeMessages[err.code] || err.message || 'Account creation failed.';
      throw new Error(message);
    }
  };

  const loginWithFirebaseGoogle = async () => {
    try {
      const result = await fbSignInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Try logging in to API using Google email
      try {
        const res = await api.post('/auth/login', { identifier: fbUser.email, password: 'student123' });
        const { token: authToken, user: userData } = res.data;

        setToken(authToken);
        setUser(userData);
        localStorage.setItem('mitra_token', authToken);
        localStorage.setItem('mitra_user', JSON.stringify(userData));
        return userData;
      } catch (err) {
        // Fallback demo user mapping if not registered in DB
        const fallbackUser = {
          _id: fbUser.uid,
          name: fbUser.displayName || 'Firebase User',
          email: fbUser.email,
          role: 'student',
          team: 'Vibe Coding',
          rollNumber: 'FB' + fbUser.uid.slice(0, 6).toUpperCase()
        };
        setUser(fallbackUser);
        localStorage.setItem('mitra_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
    } catch (err) {
      console.warn('Firebase Google Auth error:', err?.code, err?.message);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-action' || err?.message?.includes('invalid')) {
        throw new Error('Google Authentication is not enabled in Firebase Console for "attendance-5f43e". Please go to Firebase Console (console.firebase.google.com) -> Authentication -> Sign-in method -> Enable "Google" and "Email/Password".');
      }
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed before completing authentication.');
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error('localhost is not listed in Authorized Domains under Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      }
      throw new Error(err.message || 'Firebase Google authentication failed.');
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mitra_token');
    localStorage.removeItem('mitra_user');
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
  };

  const value = {
    user,
    token,
    firebaseUser,
    loading,
    login,
    register,
    loginWithFirebaseGoogle,
    logout,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
