import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Replace with your Firebase project configuration
const firebaseConfig = {
   apiKey: "AIzaSyDUHbZwNsQWPjZJVyIYJeP3BzBZ4xiAESQ",
  authDomain: "student-management-syste-ded9d.firebaseapp.com",
  projectId: "student-management-syste-ded9d",
  storageBucket: "student-management-syste-ded9d.firebasestorage.app",
  messagingSenderId: "95980049899",
  appId: "1:95980049899:web:964199328d809a7fc5b5ae"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
};