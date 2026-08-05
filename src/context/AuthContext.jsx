import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc 
} from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign Up new users & save role to Firestore
  const signup = async ({ name, email, password, role }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Secure fallback: protect against admin role injection on signup
    const safeRole = role === 'admin' ? 'student' : role;

    // Save profile and role to Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), {
      name,
      email,
      role: safeRole,
      createdAt: new Date().toISOString()
    });

    setUser({ uid: firebaseUser.uid, name, email, role: safeRole });
  };

  // Sign In existing users & fetch role from Firestore
  const login = async ({ email, password }) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user details & role from Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUser({ uid: firebaseUser.uid, ...userData });
      return userData;
    } else {
      throw new Error("User record not found.");
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  // Persist authentication state across page reloads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);