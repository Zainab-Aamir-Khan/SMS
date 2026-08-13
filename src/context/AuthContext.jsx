// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("Auth observed valid user session:", firebaseUser.email);
          
          // 🚀 Hardcoded Super Admin Override for Safety
          let detectedRole = firebaseUser.email === 'sohailasghar@gmail.com' ? 'admin' : 'student';

          let userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: detectedRole // Safe fallback assignment
          };

          try {
            // ⚡ Optimized: Direct Document Fetch using UID instead of Email Query
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              const firestoreData = userSnap.data();
              userData = {
                ...userData,
                ...firestoreData,
                role: firestoreData.role || detectedRole // Ensure role is never empty
              };
            }
          } catch (firestoreError) {
            console.warn("Firestore look-up skipped or restricted:", firestoreError);
          }

          console.log("Setting Final Global User Context:", userData);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Critical Auth Sync Error:", error);
        setUser(null);
      } finally {
        // Safe placement ensuring loading is turned off only after user context is fully built
        setLoading(false); 
      }
    }, (error) => {
      console.error("Auth observer failure:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);