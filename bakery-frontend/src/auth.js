import { api } from './api.js';
import { showToast } from './toast.js';

let currentUser = null;
const authListeners = [];

export function onAuthStateChanged(callback) {
  authListeners.push(callback);
  callback(currentUser);
}

function notifyAuthChange() {
  authListeners.forEach((cb) => cb(currentUser));
}

export function getCurrentUser() {
  return currentUser;
}

export function isLoggedIn() {
  return !!currentUser && !!api.getToken();
}

export function isAdmin() {
  return currentUser && currentUser.role === 'ADMIN';
}

export function initAuth() {
  currentUser = api.getUser();
  notifyAuthChange();

  // Setup modal toggle buttons
  const authModal = document.getElementById('auth-modal');
  const loginTabBtn = document.getElementById('tab-login');
  const registerTabBtn = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const modalCloseBtn = document.getElementById('auth-modal-close');

  if (loginTabBtn && registerTabBtn) {
    loginTabBtn.addEventListener('click', () => {
      loginTabBtn.classList.add('active');
      registerTabBtn.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });

    registerTabBtn.addEventListener('click', () => {
      registerTabBtn.classList.add('active');
      loginTabBtn.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeAuthModal);
  }

  // Close modal when clicking outside backdrop
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        closeAuthModal();
      }
    });
  }

  // Handle Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        const res = await api.login(email, password);
        api.setToken(res.token);
        api.setUser(res.user);
        currentUser = res.user;
        notifyAuthChange();
        showToast(`Welcome back, ${res.user.name}! 🥐`, 'success');
        closeAuthModal();
        loginForm.reset();
      } catch (err) {
        showToast(err.message || 'Login failed. Check credentials.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // Handle Register submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        const res = await api.register(name, email, password, role);
        api.setToken(res.token);
        api.setUser(res.user);
        currentUser = res.user;
        notifyAuthChange();
        showToast(`Account created! Welcome, ${res.user.name} 🎉`, 'success');
        closeAuthModal();
        registerForm.reset();
      } catch (err) {
        showToast(err.message || 'Registration failed. Try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
}

export function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('open');

  const loginTabBtn = document.getElementById('tab-login');
  const registerTabBtn = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (mode === 'register') {
    registerTabBtn?.click();
  } else {
    loginTabBtn?.click();
  }
}

export function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
}

export function logout() {
  api.clearSession();
  currentUser = null;
  notifyAuthChange();
  showToast('You have been logged out. See you soon! 🥖', 'info');
}
