// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- KONFIGURASI DATABASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDRqQx_YDkitfgSt7BgJ-4ZboUy4hf_Txc",
  authDomain: "lyxe-anim-db.firebaseapp.com",
  // BARIS INI WAJIB ADA KARENA KAMU PAKE REALTIME DATABASE (getDatabase)
  // DAN LOKASI SERVERMU DI ASIA (Singapore/Jakarta)
  databaseURL: "https://lyxe-anim-db-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "lyxe-anim-db",
  storageBucket: "lyxe-anim-db.firebasestorage.app",
  messagingSenderId: "586697186836",
  appId: "1:586697186836:web:35eaa0daf369da93231101",
  measurementId: "G-HDFJNM4LGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // Ini butuh databaseURL di atas
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, database, auth, db };