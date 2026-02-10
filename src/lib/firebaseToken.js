import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Database Khusus Token Premium (komen-1ee45)
const tokenFirebaseConfig = {
  apiKey: "AIzaSyDTcbRUWzRKTl6LKyTg0_j2XJcX4e06Am8",
  authDomain: "komen-1ee45.firebaseapp.com",
  databaseURL: "https://komen-1ee45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komen-1ee45",
  storageBucket: "komen-1ee45.firebasestorage.app",
  messagingSenderId: "953509129047",
  appId: "1:953509129047:web:90be3e4d88be1782a52c12",
  measurementId: "G-JY2VYJQLJ8"
};

// Initialize Firebase App Khusus Token (Singleton Pattern)
// Cek apakah app "tokenApp" sudah ada? Kalau ada pakai itu, kalau belum buat baru.
let tokenApp;
if (getApps().length > 0 && getApps().some(app => app.name === "tokenApp")) {
    tokenApp = getApp("tokenApp");
} else {
    tokenApp = initializeApp(tokenFirebaseConfig, "tokenApp");
}

const dbToken = getFirestore(tokenApp);

export { dbToken };