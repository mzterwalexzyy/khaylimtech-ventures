// ========================================================
//  KhaylimTech — Admin Roles & Authorization Module
//  Manages authorized admin emails and access privileges.
// ========================================================

(function () {
  'use strict';

  // Primary Super Admins (Hardcoded so access is immediately guaranteed)
  const DEFAULT_ADMINS = [
    "kareemtoheeba10@gmail.com",
    "khaylimtech@gmail.com"
  ];

  // List of active admin emails (initialized with Super Admins)
  window.KHAYLIM_ADMINS = DEFAULT_ADMINS.map(e => e.toLowerCase());

  // Helper: Check if an email is an authorized admin
  window.isAdminEmail = function (email) {
    if (!email || typeof email !== 'string') return false;
    const cleanEmail = email.trim().toLowerCase();
    return window.KHAYLIM_ADMINS.map(e => e.toLowerCase()).includes(cleanEmail);
  };

  // Helper: Check if a Firebase User is an authorized admin
  window.isUserAdmin = function (user) {
    if (!user || !user.email) return false;
    return window.isAdminEmail(user.email);
  };

  // Listen to Firestore settings/admins for dynamic 2nd admin support
  function loadDynamicAdmins() {
    if (!window.firebase || !firebase.firestore) {
      setTimeout(loadDynamicAdmins, 200);
      return;
    }

    try {
      const db = firebase.firestore();
      db.collection('settings').doc('admins').onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          const extraAdmins = Array.isArray(data.emails) ? data.emails : [];
          
          // Merge unique emails, always keeping the default admins
          const merged = new Set(DEFAULT_ADMINS.map(e => e.toLowerCase()));
          extraAdmins.forEach(e => {
            if (e && typeof e === 'string') merged.add(e.trim().toLowerCase());
          });
          window.KHAYLIM_ADMINS = Array.from(merged);
        } else {
          // Initialize doc if it doesn't exist
          db.collection('settings').doc('admins').set({
            emails: DEFAULT_ADMINS.map(e => e.toLowerCase()),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: DEFAULT_ADMINS[0]
          }, { merge: true }).catch(err => console.warn('Init admins doc notice:', err));
        }

        // Trigger any registered admin state listeners
        if (typeof window.onAdminListUpdated === 'function') {
          window.onAdminListUpdated(window.KHAYLIM_ADMINS);
        }
      }, (err) => {
        console.warn('Firestore admins listener notice:', err);
      });
    } catch (e) {
      console.warn('Error loading dynamic admins:', e);
    }
  }

  // Auto initialize on DOM ready or immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicAdmins);
  } else {
    loadDynamicAdmins();
  }
})();
