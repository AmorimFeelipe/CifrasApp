// client/src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// COPIE E COLE SUAS CHAVES AQUI (Elas aparecem no console do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAlxicC-LWHklmk3Zcp6UEd_mKYXWx5_yA",
  authDomain: "cifrasapp-2c339.firebaseapp.com",
  projectId: "cifrasapp-2c339",
  storageBucket: "cifrasapp-2c339.firebasestorage.app",
  messagingSenderId: "111070986112",
  appId: "1:111070986112:web:213c3cf2b0639d3dec0b65"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);