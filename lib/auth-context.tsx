"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase-client';

interface AuthContextValue {
  user: User | null;
  labId: string | null;
  profilePicture: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setLabId: (id: string) => void;
  setProfilePicture: (url: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  labId: null,
  profilePicture: null,
  loading: true,
  signOut: async () => {},
  setLabId: () => {},
  setProfilePicture: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [labId, setLabIdState] = useState<string | null>(null);
  const [profilePicture, setProfilePictureState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setLabIdState(snap.data().lab_id ?? null);
            setProfilePictureState(snap.data().profile_picture_url ?? null);
          } else {
            // First time this user is seen — create their profile
            await setDoc(ref, { email: u.email ?? '', lab_id: null, profile_picture_url: null });
            setLabIdState(null);
            setProfilePictureState(null);
          }
        } catch {
          setLabIdState(null);
        }
      } else {
        setLabIdState(null);
        setProfilePictureState(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  function setLabId(id: string) {
    setLabIdState(id);
  }

  function setProfilePicture(url: string) {
    setProfilePictureState(url);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, labId, profilePicture, loading, signOut, setLabId, setProfilePicture }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
