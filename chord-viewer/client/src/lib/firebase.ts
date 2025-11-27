// client/src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// SUBSTITUA COM SUAS CHAVES DO CONSOLE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "cifrasapp-....firebaseapp.com",
  projectId: "cifrasapp-...",
  storageBucket: "cifrasapp-....appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);