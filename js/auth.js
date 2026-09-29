// ========================================================
//  KhaylimTech — Customer Authentication Module
//  Supports Google 1-Click Sign-In (Gmail) & Email/Password
//  Powered by Firebase Authentication & Firestore
// ========================================================

(function () {
  'use strict';

  // Inject sleek Apple-inspired auth styles
  const authStyles = document.createElement('style');
  authStyles.id = 'khaylim-auth-styles';
  authStyles.textContent = `
    /* Auth Trigger in Navbar */
    .nav-auth-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      background: rgba(201, 162, 39, 0.12);
      color: var(--gold-dark, #c9a227);
      border: 1px solid rgba(201, 162, 39, 0.35);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
    }
    .nav-auth-btn:hover {
      background: var(--gold, #c9a227);
      color: #0d0d12;
      border-color: var(--gold, #c9a227);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(201, 162, 39, 0.25);
    }
    .nav-auth-user {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 4px;
      border-radius: 999px;
      background: var(--card-bg, rgba(255, 255, 255, 0.8));
      border: 1px solid var(--border, rgba(0, 0, 0, 0.08));
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text, #111);
      position: relative;
    }
    .nav-user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a227, #e8c85a);
      color: #0d0d12;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      overflow: hidden;
      object-fit: cover;
    }

    /* User Dropdown */
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 240px;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
      border-radius: 16px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.15);
      padding: 12px;
      display: none;
      flex-direction: column;
      gap: 6px;
      z-index: 10002;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      animation: authFadeIn 0.2s ease-out;
    }
    [data-theme="dark"] .user-dropdown-menu {
      background: rgba(22, 22, 29, 0.95);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .user-dropdown-menu.show {
      display: flex;
    }
    .dropdown-user-header {
      padding: 8px 10px 10px;
      border-bottom: 1px solid var(--border, rgba(0,0,0,0.06));
    }
    .dropdown-user-name {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text, #111);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-user-email {
      font-size: 0.72rem;
      color: var(--text-muted, #777);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-user-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #10b981;
      margin-top: 4px;
    }
    .dropdown-item-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 0.82rem;
      color: var(--text, #222);
      transition: background 0.15s ease;
      text-decoration: none;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }
    .dropdown-item-link:hover {
      background: rgba(201, 162, 39, 0.1);
      color: var(--gold-dark, #c9a227);
    }
    .dropdown-item-link.danger:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* Auth Modal Backdrop */
    .auth-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.25s ease, visibility 0.25s ease;
    }
    .auth-modal-backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    /* Auth Modal Card */
    .auth-modal-card {
      width: 100%;
      max-width: 440px;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, rgba(255, 255, 255, 0.2));
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      position: relative;
      transform: scale(0.95) translateY(10px);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    [data-theme="dark"] .auth-modal-card {
      background: #14141c;
      border-color: rgba(255, 255, 255, 0.1);
    }
    .auth-modal-backdrop.open .auth-modal-card {
      transform: scale(1) translateY(0);
    }

    .auth-modal-close {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      color: var(--text-muted, #777);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      z-index: 10;
    }
    [data-theme="dark"] .auth-modal-close {
      background: rgba(255, 255, 255, 0.08);
      color: #aaa;
    }
    .auth-modal-close:hover {
      background: rgba(201, 162, 39, 0.2);
      color: var(--gold-dark, #c9a227);
    }

    .auth-modal-header {
      padding: 28px 28px 16px;
      text-align: center;
    }
    .auth-modal-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      letter-spacing: -0.02em;
      font-size: 1.1rem;
      color: var(--text, #111);
      margin-bottom: 8px;
    }
    .auth-modal-brand span {
      color: var(--gold, #c9a227);
    }
    .auth-modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text, #111);
      margin-bottom: 6px;
    }
    .auth-modal-sub {
      font-size: 0.84rem;
      color: var(--text-muted, #666);
    }

    /* Auth Tab Switcher */
    .auth-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      margin: 0 28px 20px;
      padding: 4px;
      position: relative;
    }
    [data-theme="dark"] .auth-tabs {
      background: rgba(255, 255, 255, 0.05);
    }
    .auth-tab-btn {
      flex: 1;
      padding: 8px 12px;
      font-size: 0.84rem;
      font-weight: 600;
      border-radius: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted, #777);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    .auth-tab-btn.active {
      background: var(--bg-card, #ffffff);
      color: var(--text, #111);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    [data-theme="dark"] .auth-tab-btn.active {
      background: #20202c;
      color: #fff;
    }

    .auth-modal-body {
      padding: 0 28px 28px;
    }

    /* Google Button */
    .btn-google-auth {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
      color: var(--text, #111);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    [data-theme="dark"] .btn-google-auth {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .btn-google-auth:hover {
      border-color: var(--gold, #c9a227);
      background: rgba(201, 162, 39, 0.04);
      transform: translateY(-1px);
    }

    /* Auth Divider */
    .auth-divider {
      display: flex;
      align-items: center;
      margin: 18px 0;
      color: var(--text-muted, #888);
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .auth-divider::before, .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border, rgba(0, 0, 0, 0.1));
    }
    .auth-divider span {
      padding: 0 10px;
    }

    /* Form Fields */
    .auth-form-group {
      margin-bottom: 14px;
    }
    .auth-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--text, #333);
    }
    .auth-input-wrap {
      position: relative;
    }
    .auth-input {
      width: 100%;
      padding: 11px 14px;
      border-radius: 10px;
      border: 1px solid var(--border, rgba(0, 0, 0, 0.14));
      background: rgba(0, 0, 0, 0.02);
      font-size: 0.88rem;
      color: var(--text, #111);
      box-sizing: border-box;
      transition: all 0.2s ease;
    }
    [data-theme="dark"] .auth-input {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .auth-input:focus {
      outline: none;
      border-color: var(--gold, #c9a227);
      box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.18);
    }

    .auth-submit-btn {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: linear-gradient(135deg, #c9a227, #e0b838);
      color: #0d0d12;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(201, 162, 39, 0.25);
      margin-top: 6px;
    }
    .auth-submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(201, 162, 39, 0.35);
    }

    .auth-feedback-toast {
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      margin-bottom: 12px;
      display: none;
    }
    .auth-feedback-toast.error {
      display: block;
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .auth-feedback-toast.success {
      display: block;
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .auth-footer-links {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      font-size: 0.76rem;
      color: var(--text-muted, #777);
    }
    .auth-footer-links a {
      color: var(--gold-dark, #c9a227);
      cursor: pointer;
      text-decoration: underline;
    }

    @keyframes authFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(authStyles);

  // Build Auth Modal HTML structure
  function createAuthModal() {
    if (document.getElementById('khaylim-auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'khaylim-auth-modal';
    modal.className = 'auth-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="auth-modal-card">
        <button class="auth-modal-close" id="btn-close-auth" aria-label="Close dialog">✕</button>
        <div class="auth-modal-header">
          <div class="auth-modal-brand">KHAYLIM<span>TECH</span></div>
          <div class="auth-modal-title" id="auth-title">Welcome to KhaylimTech</div>
          <div class="auth-modal-sub" id="auth-sub">Sign in with your Google Account or Email to track orders &amp; unlock VIP pricing.</div>
        </div>

        <div class="auth-tabs">
          <button type="button" class="auth-tab-btn active" id="tab-signin">Sign In</button>
          <button type="button" class="auth-tab-btn" id="tab-signup">Create Account</button>
        </div>

        <div class="auth-modal-body">
          <div class="auth-feedback-toast" id="auth-toast"></div>

          <!-- Google 1-Click Button -->
          <button type="button" class="btn-google-auth" id="btn-google-signin">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Continue with Google
          </button>

          <div class="auth-divider"><span>or continue with email</span></div>

          <form id="khaylim-auth-form" novalidate>
            <div class="auth-form-group" id="group-name" style="display: none;">
              <label class="auth-label" for="auth-input-name">Full Name</label>
              <div class="auth-input-wrap">
                <input type="text" class="auth-input" id="auth-input-name" placeholder="e.g. Babatunde Lawal">
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-label" for="auth-input-email">Email Address</label>
              <div class="auth-input-wrap">
                <input type="email" class="auth-input" id="auth-input-email" placeholder="you@example.com" required>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-label" for="auth-input-password">Password</label>
              <div class="auth-input-wrap">
                <input type="password" class="auth-input" id="auth-input-password" placeholder="At least 6 characters" required>
              </div>
            </div>

            <button type="submit" class="auth-submit-btn" id="btn-submit-auth">Sign In</button>
          </form>

          <div class="auth-footer-links">
            <a id="btn-forgot-password">Forgot password?</a>
            <span id="auth-toggle-note">Need an account? <a id="link-switch-to-signup">Sign up</a></span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    bindAuthEvents();
  }

  let authMode = 'signin'; // 'signin' or 'signup'

  function showToast(message, isError = true) {
    const toast = document.getElementById('auth-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `auth-feedback-toast ${isError ? 'error' : 'success'}`;
    toast.style.display = 'block';
  }

  function clearToast() {
    const toast = document.getElementById('auth-toast');
    if (toast) {
      toast.textContent = '';
      toast.style.display = 'none';
    }
  }

  function setAuthMode(mode) {
    authMode = mode;
    clearToast();
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const groupName = document.getElementById('group-name');
    const btnSubmit = document.getElementById('btn-submit-auth');
    const authTitle = document.getElementById('auth-title');
    const authToggleNote = document.getElementById('auth-toggle-note');

    if (mode === 'signup') {
      tabSignin.classList.remove('active');
      tabSignup.classList.add('active');
      groupName.style.display = 'block';
      btnSubmit.textContent = 'Create Account';
      authTitle.textContent = 'Create Your Account';
      authToggleNote.innerHTML = `Already have an account? <a id="link-switch-to-signin">Sign in</a>`;
      document.getElementById('link-switch-to-signin')?.addEventListener('click', () => setAuthMode('signin'));
    } else {
      tabSignup.classList.remove('active');
      tabSignin.classList.add('active');
      groupName.style.display = 'none';
      btnSubmit.textContent = 'Sign In';
      authTitle.textContent = 'Welcome Back';
      authToggleNote.innerHTML = `Need an account? <a id="link-switch-to-signup">Sign up</a>`;
      document.getElementById('link-switch-to-signup')?.addEventListener('click', () => setAuthMode('signup'));
    }
  }

  function openAuthModal(defaultMode = 'signin') {
    createAuthModal();
    setAuthMode(defaultMode);
    const modal = document.getElementById('khaylim-auth-modal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    const modal = document.getElementById('khaylim-auth-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function bindAuthEvents() {
    const modal = document.getElementById('khaylim-auth-modal');
    const btnClose = document.getElementById('btn-close-auth');
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const btnGoogle = document.getElementById('btn-google-signin');
    const form = document.getElementById('khaylim-auth-form');
    const btnForgot = document.getElementById('btn-forgot-password');

    btnClose.addEventListener('click', closeAuthModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAuthModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeAuthModal();
      }
    });

    tabSignin.addEventListener('click', () => setAuthMode('signin'));
    tabSignup.addEventListener('click', () => setAuthMode('signup'));

    // Google Sign In
    btnGoogle.addEventListener('click', async () => {
      if (!window.firebase || !firebase.auth) {
        showToast('Firebase Auth is initializing. Please retry in a moment.');
        return;
      }
      clearToast();
      btnGoogle.disabled = true;
      btnGoogle.style.opacity = '0.7';

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;

        // Sync with Firestore
        if (window.db) {
          try {
            await window.db.collection('users').doc(user.uid).set({
              uid: user.uid,
              displayName: user.displayName || 'Valued Customer',
              email: user.email,
              photoURL: user.photoURL || null,
              lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
              authProvider: 'google'
            }, { merge: true });
          } catch (dbErr) {
            console.warn('Firestore user sync notice:', dbErr);
          }
        }

        showToast(`Signed in as ${user.displayName || user.email}!`, false);
        setTimeout(() => {
          closeAuthModal();
        }, 800);
      } catch (err) {
        console.error('Google Auth Error:', err);
        if (err.code === 'auth/popup-closed-by-user') {
          showToast('Google sign-in popup was closed.');
        } else if (err.code === 'auth/unauthorized-domain') {
          showToast('This domain is not yet whitelisted in Firebase Console. Add localhost to Authorized Domains.');
        } else {
          showToast(err.message || 'Google sign-in failed.');
        }
      } finally {
        btnGoogle.disabled = false;
        btnGoogle.style.opacity = '1';
      }
    });

    // Email/Password submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearToast();

      const email = document.getElementById('auth-input-email').value.trim();
      const password = document.getElementById('auth-input-password').value;
      const name = document.getElementById('auth-input-name').value.trim();

      if (!email || !password) {
        showToast('Please enter both email and password.');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-auth');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        if (authMode === 'signup') {
          const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
          const user = userCredential.user;

          if (name) {
            await user.updateProfile({ displayName: name });
          }

          if (window.db) {
            try {
              await window.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                displayName: name || email.split('@')[0],
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                authProvider: 'password'
              });
            } catch (dbErr) {
              console.warn('Firestore user save notice:', dbErr);
            }
          }

          showToast('Account created successfully! Welcome to KhaylimTech.', false);
          setTimeout(() => {
            closeAuthModal();
          }, 900);
        } else {
          await firebase.auth().signInWithEmailAndPassword(email, password);
          showToast('Signed in successfully!', false);
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        }
      } catch (err) {
        console.error('Email Auth Error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          showToast('Invalid email or password. Please verify and retry.');
        } else if (err.code === 'auth/email-already-in-use') {
          showToast('An account already exists with this email. Switch to Sign In.');
        } else if (err.code === 'auth/weak-password') {
          showToast('Password is too weak. Please use a stronger password.');
        } else {
          showToast(err.message || 'Authentication failed.');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = authMode === 'signup' ? 'Create Account' : 'Sign In';
      }
    });

    // Forgot Password
    btnForgot.addEventListener('click', async () => {
      const email = document.getElementById('auth-input-email').value.trim();
      if (!email) {
        showToast('Please type your email address above to reset your password.');
        return;
      }
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast(`Password reset link sent to ${email}. Check your inbox!`, false);
      } catch (err) {
        showToast(err.message || 'Unable to send password reset email.');
      }
    });
  }

  // Mount Account button in Desktop and Mobile Navigation
  function mountAuthNavButton() {
    const navActions = document.querySelector('.nav-actions');
    const topUtilityRight = document.querySelector('.top-utility-right');
    const mobileNav = document.querySelector('.mobile-nav');

    // Add trigger to top utility bar if available
    if (topUtilityRight && !document.getElementById('utility-auth-trigger')) {
      const utilBtn = document.createElement('a');
      utilBtn.id = 'utility-auth-trigger';
      utilBtn.className = 'top-utility-link auth-open-trigger';
      utilBtn.style.cursor = 'pointer';
      utilBtn.innerHTML = `<i class="fa-regular fa-user" style="margin-right:4px;"></i> Customer Login`;
      utilBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal('signin');
      });
      topUtilityRight.prepend(utilBtn);
    }

    // Add main desktop nav trigger
    if (navActions && !document.getElementById('nav-auth-container')) {
      const authContainer = document.createElement('div');
      authContainer.id = 'nav-auth-container';
      authContainer.style.position = 'relative';
      authContainer.style.display = 'inline-flex';
      authContainer.style.alignItems = 'center';

      authContainer.innerHTML = `
        <button type="button" class="nav-auth-btn" id="nav-auth-trigger">
          <i class="fa-regular fa-circle-user"></i>
          <span>Sign In</span>
        </button>
        <div class="user-dropdown-menu" id="user-dropdown-menu">
          <div class="dropdown-user-header">
            <div class="dropdown-user-name" id="menu-user-name">Guest User</div>
            <div class="dropdown-user-email" id="menu-user-email">guest@khaylimtech.com</div>
            <div class="dropdown-user-badge"><i class="fa-solid fa-circle-check"></i> Verified Customer</div>
          </div>
          <a href="/cart" class="dropdown-item-link">
            <i class="fa-solid fa-bag-shopping" style="color:var(--gold);"></i> My Cart
          </a>
          <a href="https://wa.me/2348083873316?text=Hello%20KhaylimTech%2C%20I%20am%20logged%20in%20and%20need%20assistance." target="_blank" class="dropdown-item-link">
            <i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> Direct WhatsApp Desk
          </a>
          <button type="button" class="dropdown-item-link danger" id="btn-signout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        </div>
      `;

      // Insert right before theme-toggle or cart
      const themeToggle = navActions.querySelector('.theme-toggle');
      if (themeToggle) {
        navActions.insertBefore(authContainer, themeToggle);
      } else {
        navActions.prepend(authContainer);
      }

      // Bind button click
      const navAuthBtn = document.getElementById('nav-auth-trigger');
      const dropdown = document.getElementById('user-dropdown-menu');

      navAuthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.currentUser) {
          dropdown.classList.toggle('show');
        } else {
          openAuthModal('signin');
        }
      });

      // Close dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!authContainer.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });

      // Sign out action
      document.getElementById('btn-signout').addEventListener('click', async () => {
        dropdown.classList.remove('show');
        try {
          await firebase.auth().signOut();
        } catch (e) {
          console.error('Sign out error:', e);
        }
      });
    }

    // Add to mobile drawer
    if (mobileNav && !document.getElementById('mobile-auth-link')) {
      const mobAuth = document.createElement('a');
      mobAuth.id = 'mobile-auth-link';
      mobAuth.href = '#';
      mobAuth.innerHTML = `<i class="fa-regular fa-user"></i> <span id="mobile-auth-text">Sign In / Register</span>`;
      mobAuth.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.currentUser) {
          if (confirm(`Signed in as ${window.currentUser.displayName || window.currentUser.email}. Would you like to sign out?`)) {
            firebase.auth().signOut();
          }
        } else {
          openAuthModal('signin');
        }
      });
      mobileNav.prepend(mobAuth);
    }
  }

  // Reactive Auth State Listener
  function initAuthState() {
    if (!window.firebase || !firebase.auth) {
      setTimeout(initAuthState, 150);
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      window.currentUser = user;
      const navAuthBtn = document.getElementById('nav-auth-trigger');
      const menuUserName = document.getElementById('menu-user-name');
      const menuUserEmail = document.getElementById('menu-user-email');
      const mobileAuthText = document.getElementById('mobile-auth-text');
      const utilityTrigger = document.getElementById('utility-auth-trigger');

      if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const initial = displayName.charAt(0).toUpperCase();

        if (navAuthBtn) {
          navAuthBtn.className = 'nav-auth-user';
          if (user.photoURL) {
            navAuthBtn.innerHTML = `
              <img src="${user.photoURL}" alt="${displayName}" class="nav-user-avatar">
              <span>${displayName.split(' ')[0]}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:0.65rem;color:var(--text-muted);"></i>
            `;
          } else {
            navAuthBtn.innerHTML = `
              <div class="nav-user-avatar">${initial}</div>
              <span>${displayName.split(' ')[0]}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:0.65rem;color:var(--text-muted);"></i>
            `;
          }
        }

        if (menuUserName) menuUserName.textContent = displayName;
        if (menuUserEmail) menuUserEmail.textContent = user.email;
        if (mobileAuthText) mobileAuthText.textContent = `My Account (${displayName.split(' ')[0]})`;
        if (utilityTrigger) utilityTrigger.innerHTML = `<i class="fa-solid fa-user-check" style="margin-right:4px;color:#10b981;"></i> ${displayName.split(' ')[0]}`;
      } else {
        if (navAuthBtn) {
          navAuthBtn.className = 'nav-auth-btn';
          navAuthBtn.innerHTML = `<i class="fa-regular fa-circle-user"></i> <span>Sign In</span>`;
        }
        if (mobileAuthText) mobileAuthText.textContent = 'Sign In / Register';
        if (utilityTrigger) utilityTrigger.innerHTML = `<i class="fa-regular fa-user" style="margin-right:4px;"></i> Customer Login`;
      }
    });
  }

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountAuthNavButton();
      initAuthState();
    });
  } else {
    mountAuthNavButton();
    initAuthState();
  }

  // Expose global controller
  window.KhaylimAuth = {
    openSignIn: () => openAuthModal('signin'),
    openSignUp: () => openAuthModal('signup'),
    close: closeAuthModal
  };
})();
