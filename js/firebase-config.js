// =========================================
//  KhaylimTech — Firebase Configuration
//
//  SETUP INSTRUCTIONS:
//  1. Go to https://console.firebase.google.com
//  2. Create project "khaylimtech"
//  3. Go to Project Settings → Your apps → Add Web App
//  4. Copy your firebaseConfig values below
//  5. Replace all "REPLACE_WITH_YOUR_..." placeholders
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── Real-time product listener ──────────────────────────
// Uncomment the lines below AFTER you have set up Firebase.
// This replaces the local PRODUCTS array with live Firestore data.
//
// const q = query(collection(db, "products"), orderBy("name"));
// onSnapshot(q, (snapshot) => {
//   window.FIREBASE_PRODUCTS = snapshot.docs.map(doc => ({
//     ...doc.data(), id: doc.id
//   }));
//   // Re-render whatever page is currently active
//   if (typeof renderProducts === "function") renderProducts();
//   if (typeof renderDetail === "function") renderDetail(
//     getProductById(new URLSearchParams(location.search).get("id"))
//   );
// });

export { db };
