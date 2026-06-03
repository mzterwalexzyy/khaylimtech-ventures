// =========================================
//  KhaylimTech — Firebase Realtime Connection
//  Loads products from Firestore & overrides
//  the local PRODUCTS array automatically.
// =========================================

const firebaseConfig = {
  apiKey: "AIzaSyACJDVLJ2jtFLZEUEVwOEqhqkJnHXNnicU",
  authDomain: "khaylimtech-9ed75.firebaseapp.com",
  projectId: "khaylimtech-9ed75",
  storageBucket: "khaylimtech-9ed75.firebasestorage.app",
  messagingSenderId: "367287005158",
  appId: "1:367287005158:web:30b5d9993284656119b027"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Real-time listener — fires instantly when bot adds/updates/deletes a product
db.collection("products").onSnapshot((snapshot) => {
  if (!snapshot.empty) {
    const firestoreProducts = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id:          doc.id,
        name:        d.name        || "",
        category:    d.category    || "accessories",
        price:       Number(d.price) || 0,
        oldPrice:    d.oldPrice    ? Number(d.oldPrice) : null,
        description: d.description || "",
        image:       d.image       || "https://placehold.co/400x400/1a1a24/c9a227?text=No+Image",
        images:      d.images      || [d.image],
        rating:      Number(d.rating)  || 5.0,
        reviews:     Number(d.reviews) || 0,
        badge:       d.badge       || null,
        inStock:     d.inStock !== false,
      };
    });

    // Mutate the existing PRODUCTS array in-place (works with const declaration)
    PRODUCTS.length = 0;
    firestoreProducts.forEach(p => PRODUCTS.push(p));

    // Refresh category counts
    CATEGORIES.forEach(cat => {
      cat.count = PRODUCTS.filter(p => p.category === cat.id).length;
    });
  }

  window.firebaseLoaded = true;

  // Signal the page — wait for DOM if needed
  if (typeof window.onFirebaseReady === "function") {
    window.onFirebaseReady();
  } else {
    // Page script hasn't defined onFirebaseReady yet — wait for it
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof window.onFirebaseReady === "function") window.onFirebaseReady();
    });
  }

}, (error) => {
  console.warn("Firebase unavailable, using local sample data.", error);
  window.firebaseLoaded = true;
  if (typeof window.onFirebaseReady === "function") {
    window.onFirebaseReady();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof window.onFirebaseReady === "function") window.onFirebaseReady();
    });
  }
});
