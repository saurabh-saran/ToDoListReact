import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5x5nbygr1nFlIdgxylONIwMu2XTzm0H8",
  authDomain: "saurabh-55fae.firebaseapp.com",
  projectId: "saurabh-55fae",
  // storageBucket: "saurabh-55fae.firebasestorage.app",
  storageBucket: "saurabh-55fae.appspot.com",

  messagingSenderId: "288908446072",
  appId: "1:288908446072:web:29fd6baee9266976a4a08d",
  measurementId: "G-LHBNMM3EEB",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
